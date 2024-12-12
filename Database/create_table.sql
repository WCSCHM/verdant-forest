-- 创建数据库
CREATE DATABASE verdant_forest;

-- 使用数据库
USE verdant_forest;

-- 创建用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- 用户唯一标识
    username VARCHAR(50) NOT NULL UNIQUE,       -- 用户名
    password VARCHAR(255) NOT NULL,             -- 用户密码（建议存储加密值）
    coins INT DEFAULT 0                         -- 用户金币数量
);

-- 创建树种类表
CREATE TABLE trees (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- 树种类唯一标识
    tree_name VARCHAR(100) NOT NULL UNIQUE      -- 树名称
);

-- 创建用户种植情况表
CREATE TABLE user_trees (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- 唯一标识
    user_id INT NOT NULL,                       -- 用户 ID
    tree_id INT NOT NULL,                       -- 树种类 ID
    is_planted BOOLEAN DEFAULT FALSE,           -- 是否种植
    growth_stage INT DEFAULT 0,                 -- 生长阶段（0: 未开始, 1: 初始, 2: 中期, 3: 成熟）
    FOREIGN KEY (user_id) REFERENCES users(id), -- 关联用户表
    FOREIGN KEY (tree_id) REFERENCES trees(id)  -- 关联树种类表
);



-- 插入用户数据
INSERT INTO users (username, password, coins) VALUES
('user1', 'password1', 100),
('user2', 'password2', 200);

-- 插入树种类数据
INSERT INTO trees (tree_name) VALUES
('tree1'),
('tree2'),
('tree3'),
('tree4'),
('tree5'),
('tree6');