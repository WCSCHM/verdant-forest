const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3008;

// 中间件：解析 JSON 请求
app.use(express.json());

// 启用 CORS 中间件
app.use(cors());

// 数据库连接配置
const db = mysql.createConnection({
  host: '47.103.109.210',
  user: 'root', // 数据库用户名
  password: 'Tj123456@', // 数据库密码
  database: 'verdant_forest', // 数据库名称
});

// 数据库连接
db.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
  console.log('数据库连接成功');
});

// 路由：获取所有用户信息
app.get('/users', (req, res) => {
  const query = 'SELECT * FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('查询用户失败:', err);
      res.status(500).json({ error: '无法获取用户数据' });
      return;
    }
    res.json(results);
  });
});

// 路由：添加新用户
app.post('/users', (req, res) => {
  const { username, password } = req.body;
  const query = 'INSERT INTO users (username, password, coins) VALUES (?, ?, 0)';
  db.query(query, [username, password], (err, result) => {
    if (err) {
      console.error('添加用户失败:', err);
      res.status(500).json({ error: '无法添加用户' });
      return;
    }
    res.json({ message: '用户添加成功', userId: result.insertId });
  });
});

// 路由：获取所有树种类
app.get('/trees', (req, res) => {
  const query = 'SELECT * FROM trees';
  db.query(query, (err, results) => {
    if (err) {
      console.error('查询树种类失败:', err);
      res.status(500).json({ error: '无法获取树种类数据' });
      return;
    }
    res.json(results);
  });
});

// 路由：用户种植的树及状态
app.get('/user-trees/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT
      ut.id, t.tree_name, ut.is_planted, ut.growth_stage
    FROM
      user_trees ut
    JOIN
      trees t ON ut.tree_id = t.id
    WHERE
      ut.user_id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('查询用户种植的树失败:', err);
      res.status(500).json({ error: '无法获取用户种植的树' });
      return;
    }
    res.json(results);
  });
});

// 路由：添加用户种植树信息
app.post('/user-trees', (req, res) => {
  const { user_id, tree_id, is_planted, growth_stage } = req.body;

  // 检查用户是否已经种植了该树
  const checkQuery = 'SELECT * FROM user_trees WHERE user_id = ? AND tree_id = ?';
  db.query(checkQuery, [user_id, tree_id], (err, results) => {
    if (err) {
      console.error('检查用户种植树信息失败:', err);
      res.status(500).json({ error: '无法检查种植信息' });
      return;
    }
    if (results.length > 0) {
      // 用户已经种植了该树
      res.status(400).json({ error: '该树已种植' });
    } else {
      // 插入新的种植信息
      const insertQuery = `
        INSERT INTO user_trees (user_id, tree_id, is_planted, growth_stage)
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertQuery, [user_id, tree_id, is_planted, growth_stage], (err, result) => {
        if (err) {
          console.error('添加用户种植树信息失败:', err);
          res.status(500).json({ error: '无法添加种植信息' });
          return;
        }
        res.json({ message: '种植信息添加成功', id: result.insertId });
      });
    }
  });
});

// 路由：更新用户种植树的状态
app.put('/user-trees/:id', (req, res) => {
  const id = req.params.id;
  const { is_planted, growth_stage } = req.body;
  const query = `
    UPDATE user_trees
    SET is_planted = ?, growth_stage = ?
    WHERE id = ?
  `;
  db.query(query, [is_planted, growth_stage, id], (err, result) => {
    if (err) {
      console.error('更新用户种植树状态失败:', err);
      res.status(500).json({ error: '无法更新种植状态' });
      return;
    }
    res.json({ message: '种植状态更新成功' });
  });
});

// 路由：获取用户金币数量
app.get('/users/:id/coins', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT coins FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('查询用户金币失败:', err);
      res.status(500).json({ error: '无法获取用户金币' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({ userId, coins: results[0].coins });
  });
});

// 路由：增加/减少用户金币数量
app.put('/users/:id/coins', (req, res) => {
  const userId = req.params.id;
  const { amount } = req.body;

  if (typeof amount !== 'number') {
    res.status(400).json({ error: '无效的金额参数' });
    return;
  }

  const query = 'UPDATE users SET coins = coins + ? WHERE id = ?';
  db.query(query, [amount, userId], (err, result) => {
    if (err) {
      console.error('更新用户金币失败:', err);
      res.status(500).json({ error: '无法更新用户金币' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({ message: `用户金币已更新 ${amount >= 0 ? '增加' : '减少'} ${Math.abs(amount)} 个` });
  });
});

// 路由：用户登录
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('登录失败:', err);
      res.status(500).json({ error: '无法登录' });
      return;
    }
    if (results.length > 0) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
    }
  });
});

// 路由：获取随机题目
app.get('/question', (req, res) => {
  const query = 'SELECT * FROM questions ORDER BY RAND() LIMIT 1';
  db.query(query, (err, results) => {
    if (err) {
      console.error('获取题目失败:', err);
      res.status(500).json({ error: '无法获取题目' });
      return;
    }
    res.json(results[0]);
  });
});

// 路由：验证答案并更新金币
app.post('/answer', (req, res) => {
  const { userId, questionId, selectedOption } = req.body;
  const query = 'SELECT correct_option FROM questions WHERE id = ?';
  db.query(query, [questionId], (err, results) => {
    if (err) {
      console.error('验证答案失败:', err);
      res.status(500).json({ error: '无法验证答案' });
      return;
    }
    if (results.length > 0 && results[0].correct_option === selectedOption) {
      // 答对题目，增加金币
      const updateCoinsQuery = 'UPDATE users SET coins = coins + 10 WHERE id = ?';
      db.query(updateCoinsQuery, [userId], (err) => {
        if (err) {
          console.error('更新金币失败:', err);
          res.status(500).json({ error: '无法更新金币' });
          return;
        }
        res.json({ success: true, message: '答对了！金币增加10个' });
      });
    } else {
      res.json({ success: false, message: '答错了，请再试一次。' });
    }
  });
});

// 路由：获取用户ID
app.post('/getUserId', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT id FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('获取用户ID失败:', err);
      res.status(500).json({ error: '无法获取用户ID' });
      return;
    }
    if (results.length > 0) {
      res.json({ success: true, userId: results[0].id });
    } else {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
    }
  });
});

// 路由：获取用户种植信息
app.get('/user-trees/:userId/:treeId', (req, res) => {
  const { userId, treeId } = req.params;
  const query = 'SELECT growth_stage FROM user_trees WHERE user_id = ? AND tree_id = ?';
  db.query(query, [userId, treeId], (err, results) => {
    if (err) {
      console.error('获取用户种植信息失败:', err);
      res.status(500).json({ error: '无法获取种植信息' });
      return;
    }
    if (results.length > 0) {
      res.json({ success: true, growthStage: results[0].growth_stage });
    } else {
      res.status(404).json({ success: false, error: '未找到种植信息' });
    }
  });
});

// 路由：更新用户种植信息的生长阶段
app.put('/user-trees/:userId/:treeId', (req, res) => {
  const { userId, treeId } = req.params;
  const { growthStage } = req.body;
  const query = 'UPDATE user_trees SET growth_stage = ? WHERE user_id = ? AND tree_id = ?';
  db.query(query, [growthStage, userId, treeId], (err, results) => {
    if (err) {
      console.error('更新生长阶段失败:', err);
      res.status(500).json({ error: '无法更新生长阶段' });
      return;
    }
    res.json({ success: true, message: '生长阶段更新成功' });
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器加载成功`);
});
