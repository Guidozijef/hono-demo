import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import pool from './db.js'
import { sign, jwt } from 'hono/jwt'

import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

// 定义数据模型
const userSchema = z.object({
  username: z.string().min(2, "名字至少2个字"),
  age: z.number().max(120),
  email: z.email("邮箱格式不对")
})

const app = new Hono()


app.use('*', logger()) // 打印请求日志，方便调试


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// --- 中间件 ---


const JWT_SECRET = 'your-very-secret-key' // 实际开发请放在环境变量里

// 1. 注册接口 (模拟)
app.post('/api/register', async (c) => {
  const { username, password } = await c.req.json()
  try {
    // 实际应使用 bcrypt 加密密码，此处简化演示
    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password])
    return c.json({ success: true, message: '注册成功' })
  } catch (e: any) {
    return c.json({ success: false, error: '注册失败，可能用户名已存在' }, 400)
  }
})

// 2. 登录接口 (发放 Token)
app.post('/api/login', async (c) => {
  const { username, password } = await c.req.json()
  const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password])

  if (rows.length > 0) {
    const payload = {
      id: rows[0].id,
      username: rows[0].username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24小时过期
    }
    const token = await sign(payload, JWT_SECRET)
    return c.json({ success: true, token })
  }
  return c.json({ success: false, message: '账号或密码错误' }, 401)
})



// 只有带 /api/auth/ 开头的路由才会被检查 Token
app.use('/api/auth/*', jwt({ secret: JWT_SECRET, alg: "HS256" }))


// 这是一个受保护的接口
app.delete('/api/auth/users/:id', async (c) => {
  // 获取 Token 里的用户信息
  const payload = c.get('jwtPayload')
  console.log('操作人:', (payload as any).username)

  // 执行删除逻辑...
  return c.json({ message: '受保护的数据已删除' })
})



app.get('/user/:id', c => {
  const id = c.req.param('id')
  return c.json({ code: 200, message: `User ID is ${id}` })
})

// 查询用户列表的接口
app.get('/users/list', async (c) => {
  try {
    // 执行 SQL 查询
    const [rows] = await pool.query('SELECT * FROM customer_info LIMIT 10');
    return c.json({ success: true, data: rows });
  } catch (error) {
    return c.json({ success: false, error: '数据库连接失败', data:error }, 500);
  }
})


// 添加数据的接口
app.post('/users/insert', zValidator('json', userSchema), async (c) => {
  try {
    // 1. 获取前端传来的 JSON 数据
    const body = await c.req.json()
    const { username, age, email } = body

    // 2. 编写 SQL 语句
    // 使用 ? 作为占位符，这是最安全的做法
    const sql = 'INSERT INTO users (username, age, email) VALUES (?, ?, ?)'
    
    // 3. 执行数据库操作
    // query 方法返回一个数组，第一个元素是结果对象
    const [result] = await pool.query(sql, [username, age, email])

    // 4. 返回成功响应
    return c.json({
      success: true,
      message: '数据添加成功',
      insertId: (result as any).insertId // 获取新插入数据的自增 ID
    }, 201)

  } catch (error: any) {
    console.error('添加失败:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 删除用户的接口
app.delete('/users/delete/:id', async (c) => {
  const id = c.req.param('id')

  try {
    // SQL 语法：DELETE FROM 表名 WHERE id=?
    const sql = 'DELETE FROM users WHERE id = ?'
    const [result] = await pool.query(sql, [id])

    if ((result as any).affectedRows === 0) {
      return c.json({ success: false, message: '用户不存在，无需删除' }, 404)
    }

    return c.json({ success: true, message: '删除成功' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 修改用户信息的接口
app.put('/users/update/:id', async (c) => {
  const id = c.req.param('id') // 从 URL 获取要修改的用户 ID
  const body = await c.req.json()
  const { username, age } = body

  try {
    // SQL 语法：UPDATE 表名 SET 字段1=?, 字段2=? WHERE id=?
    const sql = 'UPDATE users SET username = ?, age = ? WHERE id = ?'
    const [result] = await pool.query(sql, [username, age, id])

    // 判断是否真的修改到了数据
    if ((result as any).affectedRows === 0) {
      return c.json({ success: false, message: '未找到该用户' }, 404)
    }

    return c.json({ success: true, message: '修改成功' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
