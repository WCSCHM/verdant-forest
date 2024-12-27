(function () {
  // ============== 基础数据配置 ==============
  const userId = localStorage.getItem('userId');
  const apiUrl = 'http://localhost:3008';
  const username = `用户${userId}`;
  let userCoins = '加载中...'; // 初始值设置为“加载中...”

  // ============== 创建样式 ==============
  const style = `
    /* 引入 Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Exo+2:wght@600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden; /* 防止滚动，保证动画完整显示 */
      font-family: 'Exo 2', sans-serif;
      background: #2e8b57; /* 基础深绿色 */
      position: relative;
    }

    /* ==== 背景花纹层 ==== */
    #backgroundPattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        /* 原有橙黄色系炫酷花纹 */
        repeating-radial-gradient(circle at 25% 25%, rgba(255, 165, 0, 0.1) 0, rgba(255, 165, 0, 0.1) 20px, transparent 20px, transparent 40px),
        repeating-radial-gradient(circle at 75% 75%, rgba(255, 215, 0, 0.1) 0, rgba(255, 215, 0, 0.1) 30px, transparent 30px, transparent 60px),
        repeating-linear-gradient(60deg, rgba(255, 165, 0, 0.05) 0, rgba(255, 165, 0, 0.05) 4px, transparent 4px, transparent 8px),
        repeating-linear-gradient(-60deg, rgba(255, 215, 0, 0.05) 0, rgba(255, 215, 0, 0.05) 4px, transparent 4px, transparent 8px),
        /* 新增橙黄色火焰状纹路 */
        radial-gradient(circle at 50% 50%, rgba(255, 140, 0, 0.3) 0%, rgba(255, 69, 0, 0) 60%);
      background-size: 150px 150px, 200px 200px, 100px 100px, 100px 100px, 100% 100%;
      opacity: 0.6;
      pointer-events: none;
      z-index: 0;
    }

    /* ==== 边沿静态橙黄色纹路 ==== */
    #borderAnimation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 20px; /* 边框宽度 */
      z-index: 2;
      pointer-events: none;
      overflow: hidden;
      border: 15px solid transparent; /* 增加边框宽度 */
      border-image: linear-gradient(45deg, #ffa500, #ff8c00, #ffd700, #ff8c00, #ffa500) 1; /* 使用边框图片 */
    }

    /* ==== 页面容器 ==== */
    #fancyContainer {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 1; /* 确保在背景层之上 */
    }

    /* ==== 左上角：图案 + 用户名 ==== */
    #userInfo {
      position: absolute;
      top: 30px;
      left: 30px;
      display: flex;
      align-items: center;
    }
    #patternIcon {
      width: 60px;
      height: 60px;
      margin-right: 15px;
      animation: bounce 2s infinite ease-in-out;
    }
    #usernameText {
      font-size: 40px; /* 增大字体大小 */
      font-weight: 800; /* 增加字体粗细 */
      color: #fffacd;  /* 柔和的淡黄色 */
      text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6);
      letter-spacing: 3px;
      font-family: 'Orbitron', sans-serif; /* 更酷炫的字体 */
    }

    /* ==== 右上角：金币图案 + 金币数字 ==== */
    #coinInfo {
      position: absolute;
      top: 30px;
      right: 30px;
      display: flex;
      align-items: center;
    }
    #coinIcon {
      width: 60px;
      height: 60px;
      margin-right: 15px;
      animation: bounce 2s infinite ease-in-out reverse;
    }
    #coinCount {
      font-size: 36px; /* 增大字体大小 */
      font-weight: 800; /* 增加字体粗细 */
      color: #fffacd; /* 柔和的淡黄色 */
      text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      font-family: 'Orbitron', sans-serif; /* 与用户名相同的酷炫字体 */
    }

    /* ==== 中心按钮容器 ==== */
    #centerButtons {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      gap: 80px; /* 增加按钮间距 */
      flex-direction: row; /* 横向排列 */
      justify-content: center;
      align-items: center;
      z-index: 1;
      flex-wrap: nowrap;
    }

    /* ==== 大按钮公共样式（增强） ==== */
    .bigButton {
      width: 500px; /* 增大按钮宽度 */
      height: 250px; /* 增大按钮高度 */
      background: linear-gradient(145deg, #ffa500, #ff8c00); /* 更柔和的橙色渐变 */
      border: 8px solid #d4ac0d;
      border-radius: 40px; /* 增加圆角 */
      box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(255,255,255,0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      font-size: 64px; /* 增大按钮文字大小 */
      font-weight: 800; /* 增加字体粗细 */
      color: #fff8dc; /* 更柔和的淡黄色 */
      text-shadow: 3px 3px 8px rgba(0,0,0,0.7);
      font-family: 'Orbitron', sans-serif; /* 更酷炫的字体 */
      position: relative;
      overflow: hidden;
      /* 添加浅黄色纹路图案 */
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255, 255, 224, 0.3) 0%, rgba(255, 255, 224, 0) 70%),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 224, 0.3) 0%, rgba(255, 255, 224, 0) 70%);
      background-blend-mode: overlay;
    }
    .bigButton:hover {
      transform: translateY(-20px) scale(1.15);
      box-shadow: 0 30px 60px rgba(0,0,0,0.7), inset 0 0 40px rgba(255,255,255,0.4);
    }

    /* ==== 为按钮添加一个涟漪背景动画 ==== */
    .bigButton::before {
      content: '';
      position: absolute;
      width: 300%;
      height: 300%;
      background: radial-gradient(circle, rgba(255,255,255,0.2), transparent 40%);
      top: -100%;
      left: -100%;
      animation: ripple 6s infinite;
      opacity: 0.3;
    }
    @keyframes ripple {
      0%   { transform: scale(0);       opacity: 0.8; }
      50%  { transform: scale(1.5);     opacity: 0.2; }
      100% { transform: scale(3.0);     opacity: 0;   }
    }

    /* ==== 按钮文字 ==== */
    .btnText {
      z-index: 1;
      position: relative;
      mix-blend-mode: normal; /* 改为正常混合模式，避免影响可读性 */
    }

    /* ==== 弹跳动画 ==== */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-20px); }
    }

    /* ==== 静态火焰闪烁动画 ==== */
    @keyframes flameFlicker {
      from { transform: scale(1) rotate(0deg); opacity: 0.3; }
      to { transform: scale(1.05) rotate(3deg); opacity: 0.5; }
    }
  `;

  // ============== 将样式插入到页面中 ==============
  const styleEl = document.createElement('style');
  styleEl.textContent = style;
  document.head.appendChild(styleEl);

  // ============== 创建背景花纹层 ==============
  const backgroundPattern = document.createElement('div');
  backgroundPattern.id = 'backgroundPattern';
  document.body.appendChild(backgroundPattern);

  // ============== 创建边沿动画层 ==============
  const borderAnimation = document.createElement('div');
  borderAnimation.id = 'borderAnimation';
  document.body.appendChild(borderAnimation);

  // ============== 创建页面主容器 ==============
  const fancyContainer = document.createElement('div');
  fancyContainer.id = 'fancyContainer';
  document.body.appendChild(fancyContainer);

  // ============== 左上角：图案 + 用户名 ==============
  const userInfo = document.createElement('div');
  userInfo.id = 'userInfo';

  // —— 自定义一个 SVG 图案（可根据喜好修改） ——
  const patternIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  patternIcon.setAttribute('id', 'patternIcon');
  patternIcon.setAttribute('viewBox', '0 0 100 100');
  patternIcon.innerHTML = `
    <defs>
      <radialGradient id="patternGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#fffacd" />
        <stop offset="100%" stop-color="#ffd700" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="40" fill="url(#patternGradient)" />
    <path d="M50 10 Q90 10 90 50 T50 90 T10 50 T50 10" fill="none" stroke="#fffacd" stroke-width="3" />
  `;
  userInfo.appendChild(patternIcon);

  // —— 用户名文本 ——
  const usernameText = document.createElement('div');
  usernameText.id = 'usernameText';
  usernameText.textContent = username;
  userInfo.appendChild(usernameText);

  fancyContainer.appendChild(userInfo);

  // ============== 右上角：金币图案 + 金币数字 ==============
  const coinInfo = document.createElement('div');
  coinInfo.id = 'coinInfo';

  // —— 自定义一个金币 SVG 图案（可根据喜好修改） ——
  const coinIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  coinIcon.setAttribute('id', 'coinIcon');
  coinIcon.setAttribute('viewBox', '0 0 100 100');
  coinIcon.innerHTML = `
    <defs>
      <radialGradient id="coinGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#fffacd" />
        <stop offset="100%" stop-color="#ffd700" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="40" fill="url(#coinGradient)" stroke="#fffacd" stroke-width="2"/>
    <text x="50" y="57" font-size="40" fill="#2e8b57" text-anchor="middle" alignment-baseline="middle" font-weight="bold">$</text>
  `;
  coinInfo.appendChild(coinIcon);

  // —— 金币数量文本 ——
  const coinCount = document.createElement('div');
  coinCount.id = 'coinCount';
  coinCount.textContent = userCoins; // 初始显示“加载中...”
  coinInfo.appendChild(coinCount);

  fancyContainer.appendChild(coinInfo);

  // ============== 中心两个大按钮 ==============
  const centerButtons = document.createElement('div');
  centerButtons.id = 'centerButtons';

  // —— 按钮 1：获取金币 ——
  const getCoinsButton = document.createElement('div');
  getCoinsButton.classList.add('bigButton');
  getCoinsButton.onclick = function () {
    window.location.href = './quiz.html';
  };
  const btnText1 = document.createElement('span');
  btnText1.classList.add('btnText');
  btnText1.textContent = '获取金币';
  getCoinsButton.appendChild(btnText1);

  // —— 按钮 2：种植树木 ——
  const plantTreeButton = document.createElement('div');
  plantTreeButton.classList.add('bigButton');
  plantTreeButton.onclick = function () {
    window.location.href = "Plant.html";
  };
  const btnText2 = document.createElement('span');
  btnText2.classList.add('btnText');
  btnText2.textContent = '种植树木';
  plantTreeButton.appendChild(btnText2);

  centerButtons.appendChild(getCoinsButton);
  centerButtons.appendChild(plantTreeButton);

  fancyContainer.appendChild(centerButtons);

  // ============== 从后端获取金币数量并更新页面 ==============
  async function fetchUserCoins(userId) {
    try {
      const response = await fetch(`${apiUrl}/users/${userId}/coins`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('用户不存在');
        } else {
          throw new Error(`请求失败: ${response.status}`);
        }
      }
      const data = await response.json();
      return data.coins;
    } catch (error) {
      console.error('获取金币失败:', error.message);
      return null;
    }
  }

  // 调用函数并更新金币数量
  fetchUserCoins(userId)
      .then(coins => {
        if (coins !== null) {
          userCoins = coins;
          coinCount.textContent = userCoins;
        } else {
          coinCount.textContent = '加载失败';
        }
      });

})();
