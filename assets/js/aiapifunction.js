const API_ENDPOINT = 'https://youn1ipym2oaxxiasnow.deepln.com/suansuan'; // 替换为您的 API 端点
let apiKey = localStorage.getItem('apiKey') || '';

// 实用函数，用于发出 API 请求
async function apiRequest(endpoint, method, data = null, isFormData = false) {
    const headers = {
        'suan-key-token': apiKey,
    };

    let body;

    if (isFormData) {
        body = data;
    } else if (data) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
    }

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex'; // Show loading overlay

    try {
        const response = await fetch(API_ENDPOINT + endpoint, {
            method,
            headers,
            body,
        });

        if (!response.ok) {
            throw new Error(`HTTP 错误！状态：${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API 请求失败：', error);
        alert('API 请求失败：' + error.message);
        throw error;
    } finally {
        overlay.style.display = 'none'; // Hide loading overlay
    }
}

// 验证
function authenticate() {
    apiKey = document.getElementById('apiKeyInput').value;
    localStorage.setItem('apiKey', apiKey);
    document.getElementById('authForm').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadModels();
    loadImageHistory();
    loadVideoHistory();
}

if (apiKey) {
    document.getElementById('authForm').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

// 选项卡管理
function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const tabButtons = document.querySelectorAll('.tab-buttons button');
    tabButtons.forEach(button => button.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-buttons button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

// 文本生成
async function generateText() {
    const userInput = document.getElementById('textGenInput').value;
    const model = document.getElementById('textGenModel').value;

    const formData = new FormData();
    formData.append('user_input', userInput);
    formData.append('model', model);

    try {
        const response = await apiRequest('/generate_text', 'POST', formData, true);
        document.getElementById('textGenOutput').innerText = '生成的文本：' + response.text;
    } catch (error) {
        console.error('生成文本出错：', error);
    }
}

// 加载文本生成模型
async function loadModels() {
    try {
        const models = await apiRequest('/models', 'POST');
        const modelSelect = document.getElementById('textGenModel');
        modelSelect.innerHTML = ''; // 清除现有选项
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.text = model;
            modelSelect.add(option);
        });
    } catch (error) {
        console.error('加载模型出错：', error);
    }
}

// 图像生成
async function generateImage() {
    const prompt = document.getElementById('imageGenPrompt').value;
    const proportion = document.getElementById('imageGenProportion').value;
    const fineness = document.getElementById('imageGenFineness').value;

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('proportion', proportion);
    formData.append('fineness', fineness);

    const loadingElement = document.getElementById('imageGenLoading');
    loadingElement.style.display = 'block';

    try {
        const response = await apiRequest('/generate_image', 'POST', formData, true);
        displayImages(response.images);
        saveImageHistory(prompt, proportion, fineness, response.images);
    } catch (error) {
        console.error('生成图像出错：', error);
    } finally {
        loadingElement.style.display = 'none';
    }
}

function displayImages(imageUrls) {
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = ''; // 清除现有图像
    imageUrls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        imagePreview.appendChild(img);
    });
}

// 图像历史
function saveImageHistory(prompt, proportion, fineness, imageUrls) {
    let history = JSON.parse(localStorage.getItem('imageGenHistory') || '[]');
    history.unshift({ // Add to the beginning of the array
        prompt,
        proportion,
        fineness,
        imageUrls,
        timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('imageGenHistory', JSON.stringify(history));
    loadImageHistory();
}

function loadImageHistory() {
    const history = JSON.parse(localStorage.getItem('imageGenHistory') || '[]');
    const historyList = document.getElementById('imageHistoryList');
    historyList.innerHTML = '';
    history.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
                <strong>${item.timestamp}</strong><br>
                提示语：${item.prompt}<br>
                比例：${item.proportion}, 精细度：${item.fineness}
            `;
        li.addEventListener('click', () => displayImages(item.imageUrls));
        historyList.appendChild(li);
    });
}

// 文本转视频生成
async function generateVideoText() {
    const prompt = document.getElementById('videoTextPrompt').value;
    const proportion = document.getElementById('videoTextProportion').value;
    const callbackUrl = document.getElementById('videoTextCallbackUrl').value;

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('proportion', proportion);
    formData.append('callbackUrl', callbackUrl);

    const loadingElement = document.getElementById('videoTextLoading');
    loadingElement.style.display = 'block';

    try {
        const response = await apiRequest('/generate_video_text', 'POST', formData, true);
        alert('视频生成任务已提交。请查看任务历史以获取更新。');
        saveVideoTask(response.task_id, prompt);
    } catch (error) {
        console.error('从文本生成视频出错：', error);
        alert('视频生成任务提交失败：' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}

// 图像转视频生成
async function generateVideoFromImage() {
    const prompt = document.getElementById('videoImagePrompt').value;
    const imageFile = document.getElementById('videoImageFile').files[0];
    const callbackUrl = document.getElementById('videoImageCallbackUrl').value;

    if (!imageFile) {
        alert('请选择一个图像文件。');
        return;
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('image_file', imageFile);
    formData.append('callbackUrl', callbackUrl);

    const loadingElement = document.getElementById('videoImageLoading');
    loadingElement.style.display = 'block';

    try {
        const response = await apiRequest('/generate_video_text_video', 'POST', formData, true);
        alert('视频生成任务已提交。请查看任务历史以获取更新。');
        saveVideoTask(response.task_id, prompt);
    } catch (error) {
        console.error('从图像生成视频出错：', error);
        alert('视频生成任务提交失败：' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}

// 视频历史
function saveVideoTask(taskId, prompt) {
    let history = JSON.parse(localStorage.getItem('videoTasks') || '[]');
    history.unshift({ // Add to the beginning of the array
        taskId: taskId,
        prompt: prompt,
        timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('videoTasks', JSON.stringify(history));
    loadVideoHistory();
}

async function loadVideoHistory() {
    const videoHistoryList = document.getElementById('videoHistory');
    videoHistoryList.innerHTML = ''; // 清除现有列表

    let videoTasks = JSON.parse(localStorage.getItem('videoTasks') || '[]');

    for (const task of videoTasks) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
                任务 ID: ${task.taskId} - 提示语: ${task.prompt} - ${task.timestamp}
                <button onclick="showTaskDetails('${task.taskId}')">获取下载链接</button>
            `;
        videoHistoryList.appendChild(listItem);
    }
}


async function showTaskDetails(taskId) {
    const taskDetailsContent = document.getElementById('taskDetailsContent');
    const taskDetailsDiv = document.getElementById('taskDetails');

    // Clear previous content
    taskDetailsContent.innerHTML = '';

    try {
        const result = await apiRequest(`/get_result`, 'POST', new URLSearchParams({task_id: taskId}), true);

        let detailsHTML = '';
        if (result.oss_url) {
            detailsHTML = `
                    <p>任务 ID: ${result.task_id}</p>
                    <p>状态: ${result.msg}</p>
                    <a href="${result.oss_url}" target="_blank" rel="noopener noreferrer">下载视频</a>
                `;
        } else {
            detailsHTML = `
                    <p>任务 ID: ${result.task_id}</p>
                    <p>状态: ${result.msg}</p>
                    <p>视频尚未准备好</p>
                `;
        }

        // Insert details at the top
        taskDetailsContent.insertAdjacentHTML('afterbegin', detailsHTML);
        taskDetailsDiv.style.display = 'block';

    } catch (error) {
        console.error('获取任务详情出错：', error);
        taskDetailsContent.innerHTML = `<p>获取任务 ${taskId} 的详情时出错。</p>`;
        taskDetailsDiv.style.display = 'block';
    }
}


// 初始加载
loadModels();
loadImageHistory();
loadVideoHistory();