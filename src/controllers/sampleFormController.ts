import { Request, Response } from 'express'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import { poolPromise } from '../config/index'

interface TestSubject {
  FullName: string
  DateOfBirth: string
  Relationship: string
  Gender: string
  SampleType: string
  ResultData?: string
}

export const generateSampleFormPDF = async (req: Request, res: Response): Promise<void> => {
  const { appointmentId } = req.params

  // Kiểm tra tham số appointmentId
  if (!appointmentId) {
    res.status(400).json({ message: 'Thiếu appointmentId' })
    return
  }

  try {
    const pool = await poolPromise
    const result = await pool.request().input('appointmentId', appointmentId).query(`
        SELECT ts.FullName, ts.DateOfBirth, ts.Relationship, ts.Gender, ts.SampleType, tr.ResultData
        FROM TestSubjects ts
        LEFT JOIN TestResults tr ON ts.AppointmentID = tr.AppointmentID
        WHERE ts.AppointmentID = @appointmentId
      `)

    const testSubjects: TestSubject[] = result.recordset

    // Kiểm tra nếu không có kết quả trả về
    if (testSubjects.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy thông tin cho appointmentId này' })
      return
    }

    // Đảm bảo thư mục sample_forms tồn tại
    const sampleFormsDir = './sample_forms'
    if (!fs.existsSync(sampleFormsDir)) {
      fs.mkdirSync(sampleFormsDir)
    }

    // Tạo file PDF cho mẫu đơn
    const formDoc = new PDFDocument()
    const formFilePath = `${sampleFormsDir}/sample_form_${appointmentId}.pdf`
    formDoc.pipe(fs.createWriteStream(formFilePath))
    formDoc.fontSize(16).text('Sample Form for DNA Test', { align: 'center' })
    formDoc.fontSize(12).text(`Appointment ID: ${appointmentId}`, { align: 'center' })
    formDoc.text('------------------------------------------------------------')

    testSubjects.forEach((subject, index) => {
      formDoc.fontSize(12).text(`Test Subject ${index + 1}:`)
      formDoc.text(`Full Name: ${subject.FullName}`)
      formDoc.text(`Date of Birth: ${subject.DateOfBirth}`)
      formDoc.text(`Relationship: ${subject.Relationship}`)
      formDoc.text(`Gender: ${subject.Gender}`)
      formDoc.text(`Sample Type: ${subject.SampleType}`)
      formDoc.text('------------------------------------------------------------')
    })

    formDoc.end()

    // Tạo file PDF cho kết quả xét nghiệm
    const resultDoc = new PDFDocument()
    const resultFilePath = `${sampleFormsDir}/test_result_${appointmentId}.pdf`
    resultDoc.pipe(fs.createWriteStream(resultFilePath))
    resultDoc.fontSize(16).text('DNA Test Result', { align: 'center' })
    resultDoc.fontSize(12).text(`Appointment ID: ${appointmentId}`, { align: 'center' })
    resultDoc.text('------------------------------------------------------------')

    testSubjects.forEach((subject, index) => {
      resultDoc.fontSize(12).text(`Test Subject ${index + 1}:`)
      resultDoc.text(`Full Name: ${subject.FullName}`)
      resultDoc.text(`Result: ${subject.ResultData || 'Not available yet'}`)
      resultDoc.text('------------------------------------------------------------')
    })

    resultDoc.end()

    // Trả về đường dẫn của các file PDF đã tạo
    res.status(200).json({
      message: 'PDF generated successfully',
      filePaths: { formPdf: formFilePath, resultPdf: resultFilePath }
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}
