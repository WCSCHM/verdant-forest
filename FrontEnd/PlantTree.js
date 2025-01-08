import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

(function () {
    /********************************************************
     *  一、基础数据 & 模型配置
     ********************************************************/
        // ======= 用户等信息（可自行替换） =======
    const userId = localStorage.getItem('userId');
    const apiUrl = 'http://localhost:3008';
    const username = `用户${userId}`;
    let userCoins = '加载中...'; // 初始值设置为"加载中..."

    // ======= 一次显示几张 =======
    const itemsToShow = 3;

    // ======= 原始图片数组（6 张），用于计算克隆并生成轮播项 =======
    const carouselImages = [
        'https://picsum.photos/800/300?random=11',
        'https://picsum.photos/800/300?random=12',
        'https://picsum.photos/800/300?random=13',
        'https://picsum.photos/800/300?random=14',
        'https://picsum.photos/800/300?random=15',
        'https://picsum.photos/800/300?random=16',
    ];

    // ======= 模型数组（6 个），在此额外添加了 title 字段，以显示树名 =======
    const treeModels = [
        { path: './Resource/tree1-3.glb',  scale: [0.30, 0.35, 0.35], title: '榕树' },
        { path: './Resource/tree2-3.glb',  scale: [0.85, 0.85, 0.85], title: '枫树' },
        { path: './Resource/tree3-3.glb',  scale: [0.25, 0.25, 0.25], title: '樱树' },
        { path: './Resource/tree4-3.glb',  scale: [5.5, 5.5, 5.5],   title: '樟树' },
        { path: './Resource/tree6-3.glb',  scale: [0.009, 0.008, 0.01], title: '松树' },
        { path: './Resource/willow-3.glb', scale: [0.25, 0.25, 0.25], title: '柳树' },
    ];

    // ======= 无缝循环：克隆前 (itemsToShow - 1) 项到末尾 =======
    const clonedPart = carouselImages.slice(0, itemsToShow - 1);
    const extendedImages = [...carouselImages, ...clonedPart];

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

    /* ==== 轮播图容器：放到页面中间 + 半透明背景 + 内边距 ==== */
    #carouselContainer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1200px;       
      height: 600px;       
      overflow: hidden;
      border: 4px solid #ffd700;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      background: rgba(0, 0, 0, 0.3);
      padding: 20px;
      z-index: 5;
    }
    #carouselInner {
      display: flex;
      height: 100%;
      transition: transform 0.5s ease-in-out;
    }

    /* 每个 item 做圆角矩形、留 margin，为 3D 场景预留位置 */
    .carouselItem {
      box-sizing: border-box;
      margin: 10px;
      min-width: calc((100% / ${itemsToShow}) - 20px);
      height: calc(100% - 20px);
      border-radius: 20px;
      background-color: rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2);
      /* ---- 悬浮效果 ---- */
      transition: transform 0.3s ease;
      cursor: pointer; /* 鼠标悬停标记 */
    }
    .carouselItem:hover {
      transform: scale(1.03);
      z-index: 10;
      box-shadow: 0 16px 32px rgba(0,0,0,0.6), inset 0 0 12px rgba(255,255,255,0.25);
    }

    /* 在矩形框顶部显示树名 */
    .treeLabel {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      text-align: center;
      font-size: 20px;
      color: #fff;
      background-color: rgba(0,0,0,0.4);
      padding: 4px 0;
      font-weight: 700;
      font-family: 'Orbitron', sans-serif;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
    }

    /* 两侧箭头按钮 */
    .arrowBtn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      color: #fff;
      font-size: 36px;
      text-align: center;
      line-height: 60px;
      cursor: pointer;
      user-select: none;
      transition: background 0.3s;
      z-index: 10;
    }
    .arrowBtn:hover {
      background: rgba(255, 255, 255, 0.6);
    }
    #leftArrow {
      left: 0;
      margin-left: 10px;
    }
    #rightArrow {
      right: 0;
      margin-right: 10px;
    }

    /* ======= 弹窗遮罩 + 内容 ======= */
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

    /********************************************************
     *  三、主要DOM结构（背景、边框、页面容器等）
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
     *  四、轮播容器 & 3D模型渲染处理
     ********************************************************/
    const carouselContainer = document.createElement('div');
    carouselContainer.id = 'carouselContainer';

    // 在容器的左右各放一个箭头
    const leftArrow = document.createElement('div');
    leftArrow.id = 'leftArrow';
    leftArrow.className = 'arrowBtn';
    leftArrow.textContent = '<'; // 或者用箭头符号 ←
    carouselContainer.appendChild(leftArrow);

    const rightArrow = document.createElement('div');
    rightArrow.id = 'rightArrow';
    rightArrow.className = 'arrowBtn';
    rightArrow.textContent = '>'; // 或者用箭头符号 →
    carouselContainer.appendChild(rightArrow);

    const carouselInner = document.createElement('div');
    carouselInner.id = 'carouselInner';
    carouselContainer.appendChild(carouselInner);

    fancyContainer.appendChild(carouselContainer);

    // 三个数组：存储每个 item 的 scene / camera / renderer
    const scenes = [];
    const cameras = [];
    const renderers = [];

    // 创建轮播项（extendedImages.length 个）
    extendedImages.forEach((_, index) => {
        const item = document.createElement('div');
        item.className = 'carouselItem';
        carouselInner.appendChild(item);

        // ------ 1) 小标题（树名） ------
        const modelConfig = treeModels[index % treeModels.length];
        const treeLabel = document.createElement('div');
        treeLabel.className = 'treeLabel';
        treeLabel.textContent = modelConfig.title || `树木 ${index + 1}`;
        item.appendChild(treeLabel);

        // ------ 2) Three.js 场景 ------
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.set(0, 1.5, 4);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        const rect = item.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height);
        renderer.setClearColor(0x000000, 0);
        item.appendChild(renderer.domElement);

        // 加载模型
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

        // 简单方向光
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 2, 3);
        scene.add(light);

        // 将点击事件绑定到 item 上
        // 为轮播项绑定点击事件
        item.addEventListener('click', async () => {
            if (typeof userCoins !== 'number') {
                console.log('金币信息尚未加载或无效，不弹窗');
                return;
            }

            const treeIndex = index % treeModels.length; // 计算在 treeModels 数组中的索引
            const treeConfig = treeModels[treeIndex]; // 获取对应的树模型配置
            const treeId = treeIndex + 1; // tree_id 为索引 + 1（假设从 1 开始编号）

            // 根据当前 userCoins，决定弹窗内容
            if (userCoins >= 50) {
                // 如果 >= 50 => 弹出"您确定要种植吗？" [确定 | 取消]
                console.log("准备种植", treeConfig.title, "（ID:", treeId, "）");
                showPopup(`您确定要种植 ${treeConfig.title} 吗？`, true, treeId);
            } else {
                // 如果 < 50 => 弹出"种植失败" [取消]
                console.log("金币不足，无法种植", treeConfig.title);
                showPopup('种植失败', false);
            }
        });


        // 存储
        scenes.push(scene);
        cameras.push(camera);
        renderers.push(renderer);
    });

    // ====== 无缝循环：当 currentIndex >= 原数组长度 => 瞬间跳回 0 ======
    let currentIndex = 0;
    const originalLength = carouselImages.length; // 6
    function showSlide(index, withTransition = true) {
        const offsetPerIndex = 100 / itemsToShow;
        carouselInner.style.transition = withTransition ? 'transform 0.5s ease-in-out' : 'none';
        carouselInner.style.transform = `translateX(-${index * offsetPerIndex}%)`;
    }

    // transition 结束后，如进入克隆区 => 瞬间跳到 0
    carouselInner.addEventListener('transitionend', () => {
        if (currentIndex >= originalLength) {
            currentIndex = 0;
            showSlide(currentIndex, false);
        }
        else if (currentIndex < 0) {
            currentIndex = originalLength - 1;
            showSlide(currentIndex, false);
        }
    });

    // 自动轮播 (每3秒)
    const autoTimer = setInterval(() => {
        currentIndex++;
        showSlide(currentIndex);
    }, 3000);

    // =========== 手动切换：左右箭头 ===========
    leftArrow.addEventListener('click', () => {
        clearInterval(autoTimer);
        currentIndex--;
        showSlide(currentIndex);
    });

    rightArrow.addEventListener('click', () => {
        clearInterval(autoTimer);
        currentIndex++;
        showSlide(currentIndex);
    });

    /********************************************************
     *  五、统一动画循环：渲染每个轮播项的场景
     ********************************************************/
    function animate() {
        requestAnimationFrame(animate);
        for (let i = 0; i < scenes.length; i++) {
            renderers[i].render(scenes[i], cameras[i]);
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

    /********************************************************
     *  六、制作一个美观弹窗
     ********************************************************/
    // 弹窗结构
    function showPopup(message, isConfirm, treeId) {
        // 1) 动态插入样式（如果只想插一次，可以加个标记判断是否已插入过）
        document.head.insertAdjacentHTML('beforeend', `
    <style id="popupStyle">
      #popupOverlay {
        position: fixed; top: 0; left: 0;
        width: 100vw; height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex; justify-content: center; align-items: center;
        z-index: 9999;
      }
      #popupContent {
        background-color: green;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        color: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .popupButton {
        background-color: yellow;
        border: none;
        padding: 10px 20px;
        margin: 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
      }
      .popupButton:hover {
        background-color: darkorange;
      }
      #popupMessage {
        font-size: 28px;
        margin-bottom: 20px;
        color: #ff0;
        font-weight: 900;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      }
    </style>
  `);

        // 2) 创建弹窗容器 (overlay)
        const popupOverlay = document.createElement('div');
        popupOverlay.id = 'popupOverlay';
        // 这里的 `isConfirm` 决定是否显示"确定"按钮
        popupOverlay.innerHTML = `
    <div id="popupContent">
      <div id="popupMessage"></div>
      <button id="popupConfirm" class="popupButton" style="display:${isConfirm ? 'inline-block' : 'none'}">确定</button>
      <button id="popupCancel" class="popupButton">取消</button>
    </div>
  `;

        // 3) 将弹窗插入到文档中
        document.body.appendChild(popupOverlay);

        // 4) 获取相关 DOM
        const popupMessage = popupOverlay.querySelector('#popupMessage');
        const popupConfirm = popupOverlay.querySelector('#popupConfirm');
        const popupCancel = popupOverlay.querySelector('#popupCancel');

        // 5) 设置提示文本
        popupMessage.textContent = message;

        // 6) 关闭弹窗函数
        function closePopup() {
            // 从文档中移除 overlay
            popupOverlay.remove();
            // 如果想同时移除已插入的 style，也可在此操作
            // const styleEl = document.getElementById('popupStyle');
            // if (styleEl) styleEl.remove();
        }

        // 7) 为按钮绑定事件
        popupConfirm?.addEventListener('click', async () => {
            console.log('点击了确定');
            closePopup();

            // 扣除金币
            const deductCoins = async (userId) => {
                try {
                    const response = await fetch(`${apiUrl}/users/${userId}/coins`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ amount: -50 }) // 扣除 50 个金币
                    });

                    if (!response.ok) {
                        throw new Error('无法扣除金币');
                    }

                    // 继续种植树木的逻辑
                    const requestData = {
                        user_id: userId,
                        tree_id: treeId,
                        is_planted: 1,
                        growth_stage: 1
                    };

                    const plantResponse = await fetch(`${apiUrl}/user-trees`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });

                    if (!plantResponse.ok) {
                        const errorData = await plantResponse.json();
                        if (errorData.error === '该树已种植') {
                            showPopup(`该树已种植`);
                        } else {
                            throw new Error(`请求失败: ${plantResponse.statusText}`);
                        }
                    } else {
                        const result = await plantResponse.json();
                        console.log('种植信息添加成功:', result);
                        showPopup(`种植信息添加成功！`);
                    }
                } catch (error) {
                    console.error('扣除金币失败:', error);
                    showPopup(`扣除金币失败，请重试！`);
                }
            };

            // 扣除金币
            await deductCoins(userId);
        });
        popupCancel.addEventListener('click', closePopup);

        // 8) 显示弹窗
        // 由于我们在创建时就插入了 DOM，弹窗默认可见
        // 如果想让它默认隐藏，可在 CSS 里 `display:none;`，然后这里再变成 block/flex
    }

    // 1) 为按钮的样式插入一段 CSS
    document.head.insertAdjacentHTML('beforeend', `
  <style>
    #myPlantBtn {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 30px;
      border-radius: 12px;
      border: none;
      font-size: 20px;
      font-weight: 700;
      cursor: pointer;
      color: #fff;
      background: linear-gradient(45deg, #ffa500, #ff8c00);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s, box-shadow 0.3s, background 0.3s, color 0.3s;
      z-index: 9999; /* 确保在最上层 */
    }

    #myPlantBtn:hover {
      transform: translateX(-50%);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
      background: linear-gradient(45deg, #ff8c00, #ff4500);
      color: #ffe4b5; /* 更亮的字颜色 */
    }
  </style>
`);

// 2) 创建按钮
    const bottomBtn = document.createElement('button');
    bottomBtn.id = 'myPlantBtn';
    bottomBtn.textContent = '查看我的种植';

// 3) 将按钮加入到文档（添加到 body 即可）
    document.body.appendChild(bottomBtn);

// 4) 点击按钮的跳转逻辑（根据需求自行修改）
    bottomBtn.addEventListener('click', () => {
        // 示例：跳转到 "/myplants" 页面
        window.location.href = '/View.html';
    });

// 1) 为按钮的样式插入一段 CSS
document.head.insertAdjacentHTML('beforeend', `
<style>
  #returnHomeBtn {
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

  #returnHomeBtn:hover {
    transform: scale(1.05);
    background: linear-gradient(45deg, #ff8c00, #ff4500);
  }
</style>
`);

// 2) 创建按钮
const returnHomeBtn = document.createElement('button');
returnHomeBtn.id = 'returnHomeBtn';
returnHomeBtn.textContent = '返回主页';

// 3) 将按钮加入到文档（添加到 body 即可）
document.body.appendChild(returnHomeBtn);

// 4) 点击按钮的跳转逻辑
returnHomeBtn.addEventListener('click', () => {
    window.location.href = 'User.html'; // 跳转到 User.html
});

})();