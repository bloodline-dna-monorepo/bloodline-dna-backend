import app from './app'
import { port } from './config'
import { initDefaultAdmin } from './utils/initAdmin'

async function start() {
  try {
    // Đảm bảo admin mặc định được khởi tạo
    await initDefaultAdmin()

    // Khởi động server trên cổng đã chỉ định
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    })
  } catch (err) {
    console.error('Failed to initialize admin or start the server', err)
    process.exit(1) // Thoát chương trình nếu có lỗi trong quá trình khởi tạo hoặc chạy server
  }
}

start()
