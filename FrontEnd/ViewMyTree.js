import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

(function () {
    /********************************************************
     *  一、基础数据 & 模型配置
     ********************************************************/
    const userId = localStorage.getItem('userId');
    const apiUrl = 'http://localhost:3008';
    const username = `用户${userId}`;
    let userCoins = '加载中...'; // 初始值

    // 模型数组（6 个），在此额外添加了 title 字段，以显示树名
    const treeModels = [
        { path: './Resource/tree1-3.glb',  scale: [0.30, 0.35, 0.35], title: '榕树' },
        { path: './Resource/tree2-3.glb',  scale: [0.85, 0.85, 0.85], title: '枫树' },
        { path: './Resource/tree3-3.glb',  scale: [0.25, 0.25, 0.25], title: '樱树' },
        { path: './Resource/tree4-3.glb',  scale: [5.5, 5.5, 5.5],   title: '樟树' },
        { path: './Resource/tree6-3.glb',  scale: [0.009, 0.008, 0.01], title: '松树' },
        { path: './Resource/willow-3.glb', scale: [0.25, 0.25, 0.25], title: '柳树' },
    ];

    /********************************************************
     *  二、插入 CSS 样式
     ********************************************************/
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
      overflow: hidden; 
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
        repeating-radial-gradient(circle at 25% 25%, rgba(255, 165, 0, 0.1) 0, rgba(255, 165, 0, 0.1) 20px, transparent 20px, transparent 40px),
        repeating-radial-gradient(circle at 75% 75%, rgba(255, 215, 0, 0.1) 0, rgba(255, 215, 0, 0.1) 30px, transparent 30px, transparent 60px),
        repeating-linear-gradient(60deg, rgba(255, 165, 0, 0.05) 0, rgba(255, 165, 0, 0.05) 4px, transparent 4px, transparent 8px),
        repeating-linear-gradient(-60deg, rgba(255, 215, 0, 0.05) 0, rgba(255, 215, 0, 0.05) 4px, transparent 4px, transparent 8px),
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
      padding: 20px;
      z-index: 2;
      pointer-events: none;
      overflow: hidden;
      border: 15px solid transparent;
      border-image: linear-gradient(45deg, #ffa500, #ff8c00, #ffd700, #ff8c00, #ffa500) 1;
    }

    /* ==== 页面容器 ==== */
    #fancyContainer {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 1;
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
      font-size: 40px;
      font-weight: 800;
      color: #fffacd;
      text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6);
      letter-spacing: 3px;
      font-family: 'Orbitron', sans-serif;
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
      font-size: 36px;
      font-weight: 800;
      color: #fffacd;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      font-family: 'Orbitron', sans-serif;
    }

    /* ==== 弹跳动画 ==== */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-20px); }
    }

    /* 
     * 现在不再使用轮播，所以这里新建一个容器，
     * 直接并排放置 6 个模型 
     */
    #modelsContainer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      width: 1200px;
      /* 也可以根据需要改成自动撑开 */
      background: rgba(0, 0, 0, 0.3);
      border: 4px solid #ffd700;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      padding: 20px;
      z-index: 5;
    }

    /* 每个模型小窗口 */
    .modelItem {
      width: 300px;
      height: 300px;
      margin: 10px;
      border-radius: 20px;
      background-color: rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    .modelItem:hover {
      transform: scale(1.03);
      z-index: 10;
      box-shadow: 0 16px 32px rgba(0,0,0,0.6), inset 0 0 12px rgba(255,255,255,0.25);
    }
    /* 树名 */
    .treeLabel {
      width: 100%;
      text-align: center;
      font-size: 18px;
      color: #fff;
      background-color: rgba(0,0,0,0.4);
      padding: 4px 0;
      font-weight: 700;
      font-family: 'Orbitron', sans-serif;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
    }

    /* ======= 弹窗遮罩 + 内容（若有需要） ======= */
    #popupOverlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5);
      display: none; /* 初始隐藏 */
      align-items: center;
      justify-content: center;
      z-index: 9999; /* 在最顶层 */
    }
    #popupContent {
      background: #fffaf0; /* 米白色 */
      border-radius: 20px;
      padding: 30px;
      min-width: 400px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      position: relative;
      text-align: center;
      animation: popupIn 0.3s ease forwards;
      font-family: 'Orbitron', sans-serif;
    }
    @keyframes popupIn {
      0%   { transform: scale(0.5) translateY(100px); opacity: 0; }
      100% { transform: scale(1) translateY(0);       opacity: 1; }
    }
    #popupMessage {
      font-size: 24px;
      margin-bottom: 20px;
      color: #333;
    }
    .popupButton {
      display: inline-block;
      margin: 0 10px;
      padding: 10px 30px;
      border-radius: 10px;
      border: none;
      font-size: 20px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      transition: background 0.3s, color 0.3s;
    }
    .popupButton:hover {
      background: #ff8;
      color: #333;
    }
    `;

    // 将样式插入页面
    const styleEl = document.createElement('style');
    styleEl.textContent = style;
    document.head.appendChild(styleEl);

    // 1) 为按钮的样式插入一段 CSS
    document.head.insertAdjacentHTML('beforeend', `
    <style>
      #returnBtn {
        position: fixed;
        bottom: 30px;
        left: 30px;
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        color: #fff;
        background: linear-gradient(45deg, #ffa500, #ff8c00);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transition: background 0.3s, transform 0.3s;
        z-index: 9999; /* 确保在最上层 */
      }

      #returnBtn:hover {
        transform: scale(1.05);
        background: linear-gradient(45deg, #ff8c00, #ff4500);
      }
    </style>
    `);

    // 2) 创建按钮
    const returnBtn = document.createElement('button');
    returnBtn.id = 'returnBtn';
    returnBtn.textContent = '返回';

    // 3) 将按钮加入到文档（添加到 body 即可）
    document.body.appendChild(returnBtn);

    // 4) 点击按钮的跳转逻辑
    returnBtn.addEventListener('click', () => {
        window.location.href = 'Plant.html'; // 跳转到 Plant.html
    });

    /********************************************************
     *  三、主要DOM结构（背景、边框、面容器等）
     ********************************************************/
        // 背景花纹
    const backgroundPattern = document.createElement('div');
    backgroundPattern.id = 'backgroundPattern';
    document.body.appendChild(backgroundPattern);

    // 边沿动画
    const borderAnimation = document.createElement('div');
    borderAnimation.id = 'borderAnimation';
    document.body.appendChild(borderAnimation);

    // 主容器
    const fancyContainer = document.createElement('div');
    fancyContainer.id = 'fancyContainer';
    document.body.appendChild(fancyContainer);

    // 左上角用户信息
    const userInfo = document.createElement('div');
    userInfo.id = 'userInfo';
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
    const usernameText = document.createElement('div');
    usernameText.id = 'usernameText';
    usernameText.textContent = username;
    userInfo.appendChild(usernameText);
    fancyContainer.appendChild(userInfo);

    // 右上角金币信息
    const coinInfo = document.createElement('div');
    coinInfo.id = 'coinInfo';
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
    const coinCount = document.createElement('div');
    coinCount.id = 'coinCount';
    coinCount.textContent = userCoins;
    coinInfo.appendChild(coinCount);
    fancyContainer.appendChild(coinInfo);

    /********************************************************
     *  四、模型容器 & 3D模型渲染处理
     ********************************************************/
        // 现在不再使用轮播容器，改为并排放置 6 个模型
    const modelsContainer = document.createElement('div');
    modelsContainer.id = 'modelsContainer';
    fancyContainer.appendChild(modelsContainer);

    // 用于存储每个模型对应的场景、相机和渲染器，以便在 animate() 中统一渲染
    const scenes = [];
    const cameras = [];
    const renderers = [];

    // 创建 6 个模型视图
    treeModels.forEach(async (modelConfig, index) => {
        // 包裹每个 3D 模型的小容器
        const item = document.createElement('div');
        item.className = 'modelItem';

        // 检查用户是否种植该树
        const isPlanted = await checkIfTreePlanted(userId, index + 1); // 假设树的 ID 从 1 开始

        // 树名
        const treeLabel = document.createElement('div');
        treeLabel.className = 'treeLabel';
        treeLabel.textContent = modelConfig.title || `树木 ${index + 1}`;
        item.appendChild(treeLabel);

        // 如果未种植，设置小窗口为灰色并禁用点击事件
        if (!isPlanted) {
            item.style.backgroundColor = 'rgba(128, 128, 128, 0.5)'; // 灰色
            item.style.pointerEvents = 'none'; // 禁用点击事件
        } else {
            // Three.js 场景
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
            camera.position.set(0, 1.5, 4);

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            item.appendChild(renderer.domElement);

            // 添加光源
            const light = new THREE.DirectionalLight(0xffffff, 1);
            light.position.set(1, 2, 3);
            scene.add(light);

            // 加载 glb 模型
            const loader = new GLTFLoader();
            loader.load(
                modelConfig.path,
                gltf => {
                    const model = gltf.scene;
                    const [sx, sy, sz] = modelConfig.scale;
                    model.scale.set(sx, sy, sz);
                    scene.add(model);
                },
                undefined,
                error => console.error('Error loading model:', error)
            );

            // 点击事件（示例）
            item.addEventListener('click', () => {
                console.log(`你点击了模型：${modelConfig.title}${index}`);
                // 跳转到 Scene.html 并传递 index
                window.location.href = `Scene.html?index=${index}`;
            });

            // 记录
            scenes.push(scene);
            cameras.push(camera);
            renderers.push(renderer);
        }

        // 追加到容器
        modelsContainer.appendChild(item);
    });

    /********************************************************
     *  五、统一动画循环：渲染每个模型的场景
     ********************************************************/
    function animate() {
        requestAnimationFrame(animate);
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const camera = cameras[i];
            const renderer = renderers[i];

            // 为了在窗口变化时保持正确渲染，需要动态计算尺寸
            const parentEl = renderer.domElement.parentElement;
            const rect = parentEl.getBoundingClientRect();
            renderer.setSize(rect.width, rect.height);

            renderer.render(scene, camera);
        }
    }
    animate();

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

    // 新增函数：检查用户是否种植该树
    async function checkIfTreePlanted(userId, treeId) {
        try {
            const response = await fetch(`${apiUrl}/user-trees/${userId}/${treeId}`);
            if (!response.ok) {
                throw new Error('无法获取种植信息');
            }
            const data = await response.json();
            return data.success; // 返回是否种植的状态
        } catch (error) {
            console.error('检查种植状态失败:', error.message);
            return false; // 默认返回未种植
        }
    }

})();
