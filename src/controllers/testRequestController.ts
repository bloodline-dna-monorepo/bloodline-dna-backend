import type { Request, Response, NextFunction } from 'express'
import { testRequestService } from '../services/testRequestService'
import { MESSAGES } from '../constants/messages'
import { asyncHandler } from '../middlewares/errorMiddleware'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { getDbPool } from '../config/database'
import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

// Đăng ký font tiếng Việt
const registerFonts = (doc: PDFKit.PDFDocument) => {
  const fontPathRegular = path.resolve(__dirname, '../fonts/Roboto-Regular.ttf')
  const fontPathBold = path.resolve(__dirname, '../fonts/Roboto-Bold.ttf')

  doc.registerFont('Roboto', fontPathRegular)
  doc.registerFont('Roboto-Bold', fontPathBold)
}

class TestRequestController {
  getAllTestRequests = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const testRequests = await testRequestService.getAllTestRequests()

    res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUESTS_RETRIEVED, testRequests })
  })

  createTestRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.accountId
    const testRequestData = { ...req.body }

    const testRequest = await testRequestService.createTestRequest(userId, testRequestData)
    res.status(201).json({ message: MESSAGES.TEST_REQUEST.CREATED, testRequest })
    return
  })

  getTestRequestById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testRequestId } = req.params
    const userId = req.user?.accountId
    const userRole = req.user?.role

    const testRequest = await testRequestService.getTestRequestById(Number.parseInt(testRequestId))
    if (!testRequest) {
      res.status(404).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_NOT_FOUND })
      return
    }

    // Check permissions - Customer can only see their own requests
    if (userRole === 'Customer' && testRequest.UserID !== userId) {
      res.status(403).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_RETRIEVED, data: testRequest })
    return
  })

  createTestConfirm = async (req: AuthRequest, res: Response): Promise<void> => {
    const testreqid = req.params.testRequestId
    const user = req.user
    if (!testreqid) {
      res.status(400).json({ message: 'Missing test Request' })
    }
    try {
      const pool = await getDbPool()
      const testreq = await pool
        .request()
        .input('id', Number.parseInt(testreqid))
        .query('SELECT * FROM TestRequests WHERE TestRequestID = @id')
      const update = await pool
        .request()
        .input('testid', testreqid)
        .input('status', 'Confirmed')
        .input('assignto', user?.accountId)
        .query('UPDATE TestRequests Set Status = @status, AssignedTo = @assignto WHERE TestRequestID = @testid')
      if (testreq.recordset[0].CollectionMethod === 'Home') {
        const kitid = 'K' + String(testreq.recordset[0].TestRequestID)
        const insert = await pool
          .request()
          .input('kitid', kitid)
          .input('testreqid', testreqid)
          .query('Insert into TestAtHome(KitID,TestRequestID) VALUES (@kitid,@testreqid)')
        res.json({ message: 'Test Process create successfully', data: insert.recordset })
      } else if (testreq.recordset[0].CollectionMethod === 'Facility') {
        const insert = await pool
          .request()
          .input('testreqid', testreqid)
          .query('Insert into TestAtFacility(TestRequestID) VALUES (@testreqid)')
        res.json({ message: 'Test Process create successfully', data: insert.recordset })
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ message: `Error entering test result: ${error.message}` })
      } else {
        res.status(500).json({ message: 'An unknown error occurred' })
      }
    }
  }

  markInProgress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const testRequestId = req.params.testRequestId
    const user = req.user

    const result = await testRequestService.markInProgress(Number.parseInt(testRequestId), user?.accountId)
    res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_IN_PROGRESS, result })
    return
  })

  createTestResultbyStaff = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testRequestId } = req.params
    const userId = req.user?.accountId
    const { testResults } = req.body

    const result = await testRequestService.createTestResult(Number.parseInt(testRequestId), userId, testResults)

    res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_COMPLETED, result })
    return
  })
  checkDuplicateIdNumber = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { idNumber } = req.params

    try {
      const exists = await testRequestService.checkDuplicateIdNumber(idNumber)
      res.status(200).json({ exists })
    } catch (error) {
      console.error('Error checking duplicate ID:', error)
      res.status(500).json({ message: 'Error checking duplicate ID number' })
    }
  })
  submitSampleInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { testRequestId } = req.params
    const userId = req.user?.accountId

    const { SampleType, TesterName, CMND, YOB, Gender, Relationship, File } = req.body

    try {
      const result = await testRequestService.submitSampleInfoByCustomer(
        Number(testRequestId),
        userId,
        SampleType,
        TesterName,
        CMND,
        YOB,
        Gender,
        Relationship,
        File
      )

      res.status(200).json({ message: MESSAGES.TEST_REQUEST.SAMPLE_INFO_SUBMITTED, data: result })
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(400).json({ message: 'CMND/CCCD đã tồn tại trong hệ thống' })
      } else {
        res.status(500).json({ message: 'Có lỗi xảy ra khi lưu thông tin mẫu' })
      }
    }
  })

  getTestResults = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testRequestId } = req.params

    const results = await testRequestService.getTestResults(Number.parseInt(testRequestId))

    res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_RESULTS_RETRIEVED, data: results })
    return
  })

  exportTestResultsPDF = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { testRequestId } = req.params
    const userId = req.user?.accountId
    const decodeBase64Image = (base64: string): Buffer => {
      try {
        const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
        const base64Data = matches ? matches[2] : base64 // nếu không có prefix, dùng nguyên chuỗi
        return Buffer.from(base64Data, 'base64')
      } catch {
        throw new Error('Ảnh base64 không hợp lệ')
      }
    }
    try {
      const pool = await getDbPool()

      // Lấy thông tin yêu cầu xét nghiệm
      const testRequestResult = await pool.request().input('testRequestId', testRequestId).input('userId', userId)
        .query(`
      SELECT 
        tr.TestRequestID,
        tr.AccountID,
        tr.ServiceID,
        tr.CollectionMethod,
        tr.Appointment,
        tr.Status,
        tr.CreatedAt,
        tr.UpdatedAt,
        s.ServiceName,
        s.ServiceType,
        s.Price,
        s.SampleCount,
        up.FullName as CustomerName,
        a.Email as CustomerEmail,
        th.KitID
      FROM TestRequests tr
      INNER JOIN Services s ON tr.ServiceID = s.ServiceID
      INNER JOIN Accounts a ON tr.AccountID = a.AccountID
      LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
      LEFT JOIN TestAtHome th ON tr.TestRequestID = th.TestRequestID
      WHERE tr.TestRequestID = @testRequestId AND tr.AccountID = @userId
    `)

      if (testRequestResult.recordset.length === 0) {
        res.status(404).json({ message: 'Test request not found or unauthorized' })
        return
      }
      const staff = await pool.request().input('testRequestId', testRequestId).query(`
        SELECT 
          tr.CreatedAt,
          up.FullName,
          up.Address,
          up.SignatureImage
        FROM TestRequests tr
        INNER JOIN Accounts a ON tr.AccountID = a.AccountID
        LEFT JOIN UserProfiles up ON tr.AssignedTo = up.AccountID
        WHERE tr.TestRequestID = @testRequestId 
      `)
      const testRequest = testRequestResult.recordset[0]

      if (testRequest.Status !== 'Completed') {
        res.status(400).json({ message: 'Test results not available yet' })
        return
      }

      const sampleResult = await pool.request().input('testRequestId', testRequestId).query(`
      SELECT TesterName, CMND, YOB, Gender, Relationship, SampleType, SignatureImage
      FROM SampleCategories
      WHERE TestRequestID = @testRequestId
      ORDER BY SampleID
    `)
      const result = await pool
        .request()
        .input('id', testRequestId)
        .query(`SELECT * FROM TestResults WHERE TestRequestID = @id`)
      // Create PDF
      const doc = new PDFDocument({ margin: 50 })
      registerFonts(doc)
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename=ket-qua-xet-nghiem-${testRequestId}.pdf`)
        res.send(pdfBuffer)
      })

      const testDate = new Date(testRequest.CreatedAt).toLocaleDateString('vi-VN')

      // === HEADER ===
      doc.font('Roboto-Bold').fontSize(12).text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' })
      doc.font('Roboto').text('Độc lập – Tự do – Hạnh phúc', { align: 'center', underline: true })
      doc.moveDown()
      doc.font('Roboto-Bold').fontSize(14).text('KẾT QUẢ XÉT NGHIỆM ADN', { align: 'center' })
      doc.moveDown(2)

      // === BODY ===
      doc.font('Roboto').fontSize(11)
      doc.text(
        `Theo Đơn yêu cầu xét nghiệm ADN ngày ${testDate} của ông ${testRequest.CustomerName} (Email: ${testRequest.CustomerEmail}), Công ty GenUnity đã tiến hành lấy mẫu xét nghiệm ADN cho những người sau:`
      )
      doc.moveDown()

      sampleResult.recordset.forEach((s, i) => {
        doc.text(`${i + 1}. Mẫu ${s.SampleType}, ghi tên ${s.TesterName}.`)
      })
      doc.moveDown()

      doc.text('Mẫu và thông tin do người yêu cầu xét nghiệm cung cấp.')
      doc.moveDown(2)

      doc.font('Roboto-Bold').text('Kết quả phân tích ADN như sau:')
      doc.font('Roboto')
      doc.moveDown()

      const samples = sampleResult.recordset
      if (samples.length >= 3) {
        const father = samples[0]?.TesterName
        const mother = samples[1]?.TesterName
        const child = samples[2]?.TesterName

        doc.text(
          `Phân tích ADN cho thấy các trình tự di truyền (gen) của ${child} có sự trùng khớp với trình tự ADN của ${father} và ${mother} tại nhiều vị trí đặc trưng dùng trong giám định quan hệ huyết thống.`
        )
        doc.moveDown()
        doc.text(
          'Mức độ trùng khớp giữa các mẫu cho thấy có quan hệ huyết thống cha – mẹ – con với độ chính xác rất cao.'
        )
      } else {
        doc.text('Phân tích ADN cho thấy có sự trùng khớp về gen giữa các mẫu đã nêu, cho thấy có quan hệ huyết thống.')
      }

      doc.moveDown(2)
      doc.font('Roboto-Bold').text('KẾT LUẬN:')
      doc.font('Roboto')
      doc.text('Căn cứ vào kết quả phân tích ADN, chúng tôi kết luận:')
      doc.moveDown()

      doc.font('Roboto-Bold').text('')

      doc.font('Roboto')

      doc.text('Mức độ thích được kết luận như sau:')
      doc.text('> 99%: Có quan hệ huyết thống cha/mẹ – con.')
      doc.text('85% – 99%: Có thể có quan hệ huyết thống gần (ví dụ: anh/chị em ruột, ông bà – cháu).')
      doc.text('25% – 85%: Có thể có quan hệ họ hàng (cô/chú/bác – cháu, anh em họ...).')
      doc.text('< 1%: Không có quan hệ huyết thống.')

      doc.moveDown(2)

      // === SIGNATURE SECTION ===
      doc.font('Roboto-Bold').text('XÁC NHẬN CỦA ĐƠN VỊ XÉT NGHIỆM')
      doc.text(`Kết quả xét nghiệm của bạn là : ${result.recordset[0].Result}.`)
      doc.moveDown(1)

      // Cột trái: chữ và chữ ký ảnh
      const leftX = 90
      const rightX = 370
      const signatureTopY = doc.y

      doc.font('Roboto-Bold').fontSize(11).text('Nhân viên xử lý', leftX, signatureTopY)
      doc
        .font('Roboto')
        .fontSize(9)
        .text('(Ký, ghi rõ họ tên hoặc lăn tay)', leftX, doc.y + 2)

      // Cột phải: Đại diện công ty
      doc.font('Roboto-Bold').fontSize(11).text('ĐẠI DIỆN CÔNG TY', rightX, signatureTopY)
      doc
        .font('Roboto')
        .fontSize(9)
        .text('(Đóng mộc hoặc lăn tay)', rightX, doc.y + 2)

      // Tọa độ để chèn ảnh sau dòng chữ
      const imageY = doc.y + 10
      const leftXx = 75
      // === CHÈN ẢNH CHỮ KÝ STAFF ===
      const staffSig = staff.recordset[0]?.SignatureImage
      if (staffSig) {
        try {
          const buffer = decodeBase64Image(staffSig)
          doc.image(buffer, leftXx, imageY, {
            width: 100,
            height: 80
          })
        } catch (err) {
          console.error('Lỗi khi hiển thị chữ ký đại diện:', err)
        }
      }

      // Thêm tên nhân viên xử lý
      doc
        .font('Roboto')
        .fontSize(11)
        .text(`${staff.recordset[0]?.FullName || 'Nhân viên xử lý'}`, leftX, imageY + 95)

      // === THÊM CON DẤU MỘC BẰNG HÌNH ẢNH ===
      try {
        const sealImagePath = path.resolve(__dirname, '../public/mocc.png')

        // Kiểm tra xem file có tồn tại không
        if (fs.existsSync(sealImagePath)) {
          const sealX = 355
          const sealY = signatureTopY + 30
          const sealSize = 120

          doc.image(sealImagePath, sealX, sealY, {
            width: sealSize,
            height: sealSize
          })
        } else {
          console.error('Company seal image not found at:', sealImagePath)
        }
      } catch (error) {
        console.error('Error loading company seal image:', error)
      }

      // Thêm tên giám đốc
      doc
        .font('Roboto-Bold')
        .fontSize(11)
        .text('Friedrich Miescher', rightX, imageY + 110)
      doc
        .font('Roboto')
        .fontSize(11)
        .text(`Ngày ${testDate}`, rightX, imageY + 125)

      doc.end()
    } catch (error) {
      console.error('Error generating PDF:', error)
      if (error instanceof Error) {
        res.status(500).json({ message: `Error generating PDF: ${error.message}` })
      } else {
        res.status(500).json({ message: 'An unknown error occurred while generating PDF' })
      }
    }
  })

  exportSampleFormPDF = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { testRequestId } = req.params
    const userId = req.user?.accountId
    const decodeBase64Image = (base64: string): Buffer => {
      try {
        const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
        const base64Data = matches ? matches[2] : base64 // nếu không có prefix, dùng nguyên chuỗi
        return Buffer.from(base64Data, 'base64')
      } catch (err) {
        throw new Error('Ảnh base64 không hợp lệ')
      }
    }

    try {
      const pool = await getDbPool()

      const testRequestResult = await pool.request().input('testRequestId', testRequestId).input('userId', userId)
        .query(`
        SELECT 
          tr.CreatedAt,
          up.FullName as CustomerName,
          up.Address,
          up.SignatureImage
        FROM TestRequests tr
        INNER JOIN Accounts a ON tr.AccountID = a.AccountID
        LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
        WHERE tr.TestRequestID = @testRequestId AND tr.AccountID = @userId
      `)

      if (testRequestResult.recordset.length === 0) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu xét nghiệm' })
        return
      }

      const testRequest = testRequestResult.recordset[0]
      const staff = await pool.request().input('testRequestId', testRequestId).query(`
        SELECT 
          tr.CreatedAt,
          up.FullName,
          up.Address,
          up.SignatureImage
        FROM TestRequests tr
        INNER JOIN Accounts a ON tr.AccountID = a.AccountID
        LEFT JOIN UserProfiles up ON tr.AssignedTo = up.AccountID
        WHERE tr.TestRequestID = @testRequestId 
      `)
      const sampleResult = await pool.request().input('testRequestId', testRequestId).query(`
      SELECT TesterName, CMND, YOB, Gender, Relationship, SampleType, SignatureImage
      FROM SampleCategories
      WHERE TestRequestID = @testRequestId
      ORDER BY SampleID
    `)

      const doc = new PDFDocument({ margin: 50 })
      registerFonts(doc)
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename=bien-ban-lay-mau-${testRequestId}.pdf`)
        res.send(pdfBuffer)
      })

      const today = new Date(testRequest.CreatedAt).toLocaleDateString('vi-VN')

      // --- HEADER ---
      doc.fontSize(12).font('Roboto-Bold').text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' })
      doc.font('Roboto').text('Độc lập – Tự do – Hạnh phúc', { align: 'center', underline: true })
      doc.moveDown()
      doc.fontSize(14).font('Roboto-Bold').text('BIÊN BẢN LẤY MẪU XÉT NGHIỆM', { align: 'center' })
      doc.moveDown()

      // --- INFO ---
      doc.font('Roboto').fontSize(11)
      doc.text(`Hôm nay, ngày ${today}, tại ......................Cơ Sở GenUnity.........................`)
      doc.moveDown()

      doc.font('Roboto-Bold').text('Chúng tôi gồm có:')
      doc.font('Roboto')
      doc.text(
        `1. Nhân viên thu mẫu: ....................................${staff.recordset[0].FullName}...................................`
      )
      doc.text(
        `2. Người yêu cầu xét nghiệm: .........................${testRequestResult.recordset[0].CustomerName}.............................`
      )
      doc.text(
        `Địa chỉ: ..............................${testRequestResult.recordset[0].Address}..........................................`
      )
      doc.moveDown()

      doc.text(
        'Chúng tôi tiến hành lấy mẫu của những người đề nghị xét nghiệm ADN. Các mẫu của từng người được lấy riêng như sau:'
      )
      doc.moveDown()

      // --- SAMPLE BLOCKS ---
      sampleResult.recordset.forEach((s, i) => {
        const lineHeight = 16
        const startX = 50
        const signatureX = 380
        const topY = doc.y

        const personNumber = i + 1
        let currentY = topY

        doc.font('Roboto-Bold').fontSize(11).text(`Người cho mẫu thứ ${personNumber}`, startX, currentY)
        currentY += lineHeight

        doc.font('Roboto').fontSize(11).text(`Họ và tên: ${s.TesterName}`, startX, currentY)
        currentY += lineHeight

        doc.text(`Năm sinh: ${s.YOB}       Giới tính: ${s.Gender}`, startX, currentY)
        currentY += lineHeight

        doc.text(`CMND/CCCD/Passport: ${s.CMND}`, startX, currentY)
        currentY += lineHeight

        doc.text(`Loại mẫu: ${s.SampleType}       Mối quan hệ: ${s.Relationship}`, startX, currentY)

        // === Vân tay box ===
        const fingerprintY = topY + lineHeight * 1

        // Vẽ khung chữ nhật
        doc.rect(signatureX, fingerprintY, 120, 60).stroke()

        // Text ghi chú nằm trên cùng trong box
        doc.fontSize(8).text('Vân tay ngón trỏ phải', signatureX + 10, fingerprintY + 2, {
          width: 100,
          align: 'center'
        })

        // Vẽ ảnh dấu vân tay nằm ngay trong box (căn giữa chiều cao)
        if (s.SignatureImage) {
          try {
            const imageBuffer = decodeBase64Image(s.SignatureImage)
            const imageWidth = 40
            const imageHeight = 40
            const imageX = signatureX + (120 - imageWidth) / 2
            const imageY = fingerprintY + 15 // Căn giữa khoảng dưới text

            doc.image(imageBuffer, imageX, imageY, {
              width: imageWidth,
              height: imageHeight
            })
          } catch (error) {
            console.error(`Lỗi hiển thị chữ ký của ${s.TesterName}:`, error)
          }
        }

        doc.moveDown(6)
      })

      // --- GHI CHÚ ---
      doc.font('Roboto').fontSize(10)
      doc.text('* Biên bản này được lập theo yêu cầu xét nghiệm ADN là một phần hành chính rất cần thiết.', 50)
      doc.text(
        '* Mẫu xét nghiệm được đóng gói, dán tem niêm phong và bảo quản theo đúng quy trình cung cấp cho phòng xét nghiệm.'
      )
      doc.moveDown(2)

      const customerSig = testRequestResult.recordset[0].SignatureImage
      const staffSig = staff.recordset[0]?.SignatureImage
      // --- CHỮ KÝ ---
      const col1X = 50
      const col2X = 350
      const rowY = doc.y

      doc.font('Roboto-Bold').fontSize(11)
      doc.text('NGƯỜI THU MẪU', col1X, rowY)
      doc.text('NGƯỜI YÊU CẦU XÉT NGHIỆM', col2X, rowY)

      doc.font('Roboto').fontSize(9)
      doc.text('(Ký, ghi rõ họ tên hoặc lăn tay)', col1X, rowY + 15)
      doc.text('(Ký, ghi rõ họ tên hoặc lăn tay)', col2X, rowY + 15)

      // === CHÈN CHỮ KÝ NGAY DƯỚI CỘT ===

      const imageWidth = 100
      const imageY = rowY + 35

      if (staffSig) {
        try {
          const buffer = decodeBase64Image(staffSig)
          doc.image(buffer, col1X, imageY, { width: imageWidth })
        } catch (error) {
          console.error('Lỗi hiển thị chữ ký người thu mẫu:', error)
        }
      }

      if (customerSig) {
        try {
          const buffer = decodeBase64Image(customerSig)
          doc.image(buffer, col2X, imageY, { width: imageWidth })
        } catch (error) {
          console.error('Lỗi hiển thị chữ ký người yêu cầu:', error)
        }
      }

      doc.moveDown(8) // Tạo khoảng trống sau phần chữ ký

      doc.end()
    } catch (error) {
      console.error('Error generating sample form PDF:', error)
      res.status(500).json({ message: 'Lỗi tạo file PDF biên bản lấy mẫu' })
    }
  })

  verifyTestResult = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const testResultId = req.params.testResultId
    const user = req.user
    if (!testResultId) {
      res.status(400).json({ message: 'Missing test Result' })
    }
    try {
      const result = await testRequestService.VerifytestResultByManager(Number.parseInt(testResultId), user?.accountId)
      res.status(200).json({
        message: MESSAGES.TEST_REQUEST.TEST_RESULT_CONFIRM,
        data: result
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ message: `Error entering test result: ${error.message}` })
      } else {
        res.status(500).json({ message: 'An unknown error occurred' })
      }
    }
  })

  getTestRequestByStaff = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userid = req.user?.accountId
    try {
      const result = await testRequestService.getTestRequestsByStaff(userid)

      res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_RETRIEVED, data: result })
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ message: `Error entering test result: ${error.message}` })
      } else {
        res.status(500).json({ message: 'An unknown error occurred' })
      }
    }
  })

  getTestRequestByCustomer = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      const userId = req.user?.accountId
      try {
        const result = await testRequestService.getTestRequestsByCustomer(userId)

        res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_RETRIEVED, data: result })
      } catch (error) {
        res.status(404).json({ message: MESSAGES.TEST_REQUEST.TEST_RESULT_NOT_FOUND })
      }
    }
  )

  viewCreateTestResult = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await testRequestService.viewCreateTestResult()
      res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_RESULTS_RETRIEVED, data: result })
    } catch (error) {
      res.status(404).json({ message: MESSAGES.TEST_REQUEST.TEST_RESULT_NOT_FOUND })
    }
  })
}

export const testRequestController = new TestRequestController()
