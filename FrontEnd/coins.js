export function setupCoinsUI(userId, apiUrl) {
    // 创建显示金币数量的文本
    const coinsDisplay = document.createElement('div');
    coinsDisplay.style.position = 'absolute';
    coinsDisplay.style.top = '100px';
    coinsDisplay.style.right = '10px';
    coinsDisplay.style.padding = '10px 20px';
    coinsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    coinsDisplay.style.color = 'white';
    coinsDisplay.style.borderRadius = '5px';
    coinsDisplay.style.fontSize = '16px';
    coinsDisplay.innerText = '金币: 加载中...'; // 初始显示
    document.body.appendChild(coinsDisplay);

    // 创建增加金币的按钮
    const addCoinsButton = document.createElement('button');
    addCoinsButton.innerText = '增加 10 金币';
    addCoinsButton.style.position = 'absolute';
    addCoinsButton.style.top = '60px';
    addCoinsButton.style.right = '10px';
    addCoinsButton.style.padding = '10px 20px';
    addCoinsButton.style.backgroundColor = '#FFD700';
    addCoinsButton.style.color = 'black';
    addCoinsButton.style.border = 'none';
    addCoinsButton.style.borderRadius = '5px';
    addCoinsButton.style.cursor = 'pointer';
    document.body.appendChild(addCoinsButton);

    // 获取用户金币数量
    function fetchCoins() {
        fetch(`${apiUrl}/users/${userId}/coins`)
            .then(response => response.json())
            .then(data => {
                coinsDisplay.innerText = `金币: ${data.coins}`;
            })
            .catch(error => {
                console.error('获取金币数量失败:', error);
                coinsDisplay.innerText = '金币: 获取失败';
            });
    }

    // 增加金币数量
    addCoinsButton.addEventListener('click', () => {
        fetch(`${apiUrl}/users/${userId}/coins`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: 10 }) // 增加 10 金币
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    console.log(data.message);
                    fetchCoins(); // 更新金币显示
                } else {
                    console.error('增加金币失败:', data.error);
                }
            })
            .catch(error => {
                console.error('增加金币请求失败:', error);
            });
    });

    // 初始化获取金币数量
    fetchCoins();
}
