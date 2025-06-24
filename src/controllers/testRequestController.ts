import type { Request, Response, NextFunction } from 'express'
import { testRequestService } from '../services/testRequestService'
import { MESSAGES } from '../constants/messages'
import { asyncHandler } from '../middlewares/errorMiddleware'
import { AuthRequest } from '../middlewares/authMiddleware'
import { getDbPool } from '../config/database'
import { log } from 'console'

class TestRequestController {
  getAllTestRequests = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const testRequests = await testRequestService.getAllTestRequests()

    res.status(403).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUESTS_RETRIEVED, testRequests })
  })

  createTestRequest = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      // Customer role
      res.status(403).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_RETRIEVED, testRequest })
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
        .input('id', parseInt(testreqid))
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
    const userRole = req.user?.role
    const { testResults } = req.body

    // Staff
    const result = await testRequestService.createTestResult(Number.parseInt(testRequestId), userId, testResults)

    res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_COMPLETED, result })
    return
  })

  submitSampleInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testRequestId } = req.params
    const userId = req.user?.accountId
    const { SampleType, TesterName, CMND, YOB, Gender, Relationship } = req.body

    // Customer
    const result = await testRequestService.submitSampleInfoByCustomer(
      Number.parseInt(testRequestId),
      userId,
      SampleType,
      TesterName,
      CMND,
      YOB,
      Gender,
      Relationship
    )
    // } else if (userRole === 'Staff') {
    //   // Staff
    //   result = await testRequestService.confirmSampleInfoByStaff(Number.parseInt(testRequestId), userId, sampleInfo)
    // }
    // res.status(200).json({ message: MESSAGES.TEST_REQUEST.SAMPLE_INFO_SUBMITTED, result })
    return
  })

  getTestResults = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testRequestId } = req.params

    const results = await testRequestService.getTestResults(Number.parseInt(testRequestId))

    res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_RESULTS_RETRIEVED, results })
    return
  })

  exportTestResultsPDF = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testRequestId } = req.params
    const userId = req.user?.accountId

    const testRequest = await testRequestService.getTestRequestById(Number.parseInt(testRequestId))
    if (!testRequest) {
      res.status(404).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_NOT_FOUND })
      return
    }

    // Check if customer owns this test request
    if (testRequest.UserID !== userId) {
      res.status(403).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    // Check if results are available
    if (testRequest.Status !== 'Results Available') {
      res.status(400).json({ message: MESSAGES.TEST_REQUEST.RESULTS_NOT_AVAILABLE })
      return
    }

    const pdfBuffer = await testRequestService.generateResultsPDF(Number.parseInt(testRequestId))

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=test-results-${testRequestId}.pdf`)
    res.send(pdfBuffer)
  })
  verifyTestResult = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const testResultId = req.params.verifyTestResult
    const user = req.user
    if (!testResultId) {
      res.status(400).json({ message: 'Missing test Result' })
    }
    try {
      const result = await testRequestService.VerifytestResultByManager(Number.parseInt(testResultId), user?.accountId)
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
      console.log('⚙️  getTestRequestByStaff called with user:', req.user)

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
      const userid = req.user?.accountId
      try {
        const result = await testRequestService.getTestRequestsByCustomer(userid)

        res.status(200).json({ message: MESSAGES.TEST_REQUEST.TEST_REQUEST_RETRIEVED, data: result })
      } catch (error: unknown) {
        if (error instanceof Error) {
          res.status(500).json({ message: `Error entering test result: ${error.message}` })
        } else {
          res.status(500).json({ message: 'An unknown error occurred' })
        }
      }
    }
  )
}

export const testRequestController = new TestRequestController()
