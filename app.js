// app.js - 순수 JavaScript 로또 6/45 추천기 로직

(function () {
  'use strict';

  // 상태 관리
  let currentTab = 'single'; // 'single' | 'bundle'
  let singleNumbers = [7, 14, 21, 28, 35, 42];
  let bundleSets = [
    [3, 11, 19, 25, 33, 41],
    [5, 12, 22, 31, 38, 45],
    [8, 17, 24, 29, 36, 43],
    [1, 14, 20, 27, 34, 40],
    [6, 15, 23, 30, 37, 44]
  ];
  let includeNumbers = [];
  let excludeNumbers = [];
  let isRolling = false;
  let history = [];
  let isFilterOpen = false;

  // DOM 요소 캐싱
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  const tabSingle = document.getElementById('tabSingle');
  const tabBundle = document.getElementById('tabBundle');
  const singleCard = document.getElementById('singleCard');
  const bundleCard = document.getElementById('bundleCard');
  const singleBallsContainer = document.getElementById('singleBalls');
  const btnRollSingle = document.getElementById('btnRollSingle');
  const btnCopySingle = document.getElementById('btnCopySingle');
  const btnRollBundle = document.getElementById('btnRollBundle');
  const btnCopyBundle = document.getElementById('btnCopyBundle');
  const btnPrintBundle = document.getElementById('btnPrintBundle');
  const bundleList = document.getElementById('bundleList');
  const filterAccordionBtn = document.getElementById('filterAccordionBtn');
  const filterAccordionBody = document.getElementById('filterAccordionBody');
  const filterCountBadge = document.getElementById('filterCountBadge');
  const filterArrow = document.getElementById('filterArrow');
  const btnResetFilter = document.getElementById('btnResetFilter');
  const includeTagList = document.getElementById('includeTags');
  const excludeTagList = document.getElementById('excludeTags');
  const numberGrid = document.getElementById('numberGrid');
  const historyCard = document.getElementById('historyCard');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');
  const btnClearHistory = document.getElementById('btnClearHistory');
  const toast = document.getElementById('toast');

  // 통계 요소
  const statSum = document.getElementById('statSum');
  const statOddEven = document.getElementById('statOddEven');
  const statLowHigh = document.getElementById('statLowHigh');
  const statConsecutive = document.getElementById('statConsecutive');

  // 볼 색상 클래스 계산 (동행복권 공식 5색 표준)
  function getBallClass(num) {
    if (num <= 10) return 'ball-yellow';
    if (num <= 20) return 'ball-blue';
    if (num <= 30) return 'ball-red';
    if (num <= 40) return 'ball-gray';
    return 'ball-green';
  }

  // 테마 초기화 및 토글
  function initTheme() {
    let saved = localStorage.getItem('lotto_theme');
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(saved);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lotto_theme', theme);
    if (theme === 'dark') {
      themeIcon.textContent = '☀️';
      themeText.textContent = '화이트 모드';
    } else {
      themeIcon.textContent = '🌙';
      themeText.textContent = '다크 모드';
    }

    // 테마 변경 시 Disqus 새로고침(테마 동기화)
    if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
      try {
        window.DISQUS.reset({ reload: true });
      } catch (e) {
        // ignore
      }
    }
  }

  themeToggleBtn.addEventListener('click', function () {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    showToast(next === 'dark' ? '🌙 다크 모드로 전환되었습니다.' : '☀️ 화이트 모드로 전환되었습니다.');
  });

  // 토스트 메시지
  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.style.display = 'flex';
    toastTimer = setTimeout(function () {
      toast.style.display = 'none';
    }, 2400);
  }

  // 로또 번호 6개 생성 함수 (포함수, 제외수 반영)
  function generateNumbers(includes = includeNumbers, excludes = excludeNumbers) {
    const validIncludes = includes.filter((n) => !excludes.includes(n)).slice(0, 5);
    const pool = [];
    for (let i = 1; i <= 45; i++) {
      if (!excludes.includes(i) && !validIncludes.includes(i)) {
        pool.push(i);
      }
    }

    const needed = 6 - validIncludes.length;
    // Fisher-Yates 셔플
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = pool[i];
      pool[i] = pool[j];
      pool[j] = temp;
    }

    const result = [...validIncludes, ...pool.slice(0, needed)];
    result.sort((a, b) => a - b);
    return result;
  }

  // 단일 추천 볼 렌더링
  function renderSingleBalls(numbers) {
    singleBallsContainer.innerHTML = '';
    numbers.forEach((num) => {
      const ball = document.createElement('div');
      ball.className = `lotto-ball ${getBallClass(num)}`;
      ball.textContent = num;
      singleBallsContainer.appendChild(ball);
    });
    updateStats(numbers);
  }

  // 통계 업데이트
  function updateStats(nums) {
    const sum = nums.reduce((a, b) => a + b, 0);
    const odd = nums.filter((n) => n % 2 !== 0).length;
    const even = 6 - odd;
    const low = nums.filter((n) => n <= 22).length;
    const high = 6 - low;

    const consecutive = [];
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i + 1] === nums[i] + 1) {
        consecutive.push(`${nums[i]}-${nums[i + 1]}`);
      }
    }

    statSum.textContent = sum;
    statOddEven.textContent = `${odd} : ${even}`;
    statLowHigh.textContent = `${low} : ${high}`;
    statConsecutive.textContent = consecutive.length > 0 ? consecutive.join(', ') : '없음';
  }

  // 단일 번호 추첨 실행
  function rollSingle() {
    if (isRolling) return;
    isRolling = true;
    btnRollSingle.disabled = true;
    btnRollSingle.textContent = '추첨 중...';

    let count = 0;
    const interval = setInterval(function () {
      const temp = Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b);
      renderSingleBalls(temp);
      count++;

      if (count >= 10) {
        clearInterval(interval);
        singleNumbers = generateNumbers();
        renderSingleBalls(singleNumbers);
        isRolling = false;
        btnRollSingle.disabled = false;
        btnRollSingle.innerHTML = '<span>🎲</span> 행운 번호 추첨하기';

        addHistory(singleNumbers, '1게임');
      }
    }, 45);
  }

  // 5게임 슬립 렌더링
  function renderBundle() {
    bundleList.innerHTML = '';
    bundleSets.forEach((set, idx) => {
      const letter = String.fromCharCode(65 + idx);
      const row = document.createElement('div');
      row.className = 'bundle-row';

      const left = document.createElement('div');
      left.className = 'game-badge';
      left.innerHTML = `<span class="game-letter">${letter}</span><span class="game-type">자동</span>`;

      const ballsDiv = document.createElement('div');
      ballsDiv.className = 'bundle-balls';
      set.forEach((num) => {
        const ball = document.createElement('div');
        ball.className = `lotto-ball ${getBallClass(num)}`;
        ball.textContent = num;
        ballsDiv.appendChild(ball);
      });

      const actions = document.createElement('div');
      actions.className = 'row-actions no-print';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn-icon';
      copyBtn.title = '이 게임 복사';
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', function () {
        copyNumbers(set, `${letter}게임`);
      });

      const rerollBtn = document.createElement('button');
      rerollBtn.className = 'btn-icon';
      rerollBtn.title = '이 게임 다시 뽑기';
      rerollBtn.textContent = '🔄';
      rerollBtn.addEventListener('click', function () {
        bundleSets[idx] = generateNumbers();
        renderBundle();
        showToast(`${letter}게임 번호가 다시 생성되었습니다.`);
      });

      actions.appendChild(copyBtn);
      actions.appendChild(rerollBtn);

      row.appendChild(left);
      row.appendChild(ballsDiv);
      row.appendChild(actions);

      bundleList.appendChild(row);
    });
  }

  // 5게임 일괄 추첨
  function rollBundle() {
    const newSets = [];
    for (let i = 0; i < 5; i++) {
      newSets.push(generateNumbers());
    }
    bundleSets = newSets;
    renderBundle();

    newSets.forEach((nums, idx) => {
      addHistory(nums, `${String.fromCharCode(65 + idx)}게임`);
    });
    showToast('5개 게임(1장)이 새롭게 추첨되었습니다!');
  }

  // 복사 기능
  function copyNumbers(nums, label) {
    const text = nums.map((n) => String(n).padStart(2, '0')).join(', ');
    navigator.clipboard.writeText(text).then(function () {
      showToast(`${label} 복사 완료: [${text}]`);
    }).catch(function () {
      showToast('복사에 실패했습니다.');
    });
  }

  function copyAllBundle() {
    const lines = bundleSets.map((set, idx) => {
      const letter = String.fromCharCode(65 + idx);
      const nums = set.map((n) => String(n).padStart(2, '0')).join(', ');
      return `[${letter}게임] ${nums}`;
    });
    const text = `=== 로또 6/45 5게임 ===\n${lines.join('\n')}\n====================`;
    navigator.clipboard.writeText(text).then(function () {
      showToast('5게임 전체 번호가 복사되었습니다!');
    });
  }

  // 1~45 번호판 렌더링
  function renderNumberGrid() {
    numberGrid.innerHTML = '';
    for (let i = 1; i <= 45; i++) {
      const btn = document.createElement('button');
      btn.className = 'grid-num-btn';
      btn.textContent = i;

      if (includeNumbers.includes(i)) {
        btn.classList.add('included');
      } else if (excludeNumbers.includes(i)) {
        btn.classList.add('excluded');
      }

      btn.addEventListener('click', function () {
        handleNumberGridClick(i);
      });
      numberGrid.appendChild(btn);
    }
  }

  function handleNumberGridClick(n) {
    if (includeNumbers.includes(n)) {
      // 포함 상태 -> 제외 상태로 변경
      includeNumbers = includeNumbers.filter((x) => x !== n);
      if (excludeNumbers.length < 39) {
        excludeNumbers.push(n);
      }
    } else if (excludeNumbers.includes(n)) {
      // 제외 상태 -> 해제 상태로 변경
      excludeNumbers = excludeNumbers.filter((x) => x !== n);
    } else {
      // 해제 상태 -> 포함 상태로 변경
      if (includeNumbers.length < 5) {
        includeNumbers.push(n);
      } else {
        showToast('포함할 번호는 최대 5개까지 가능합니다.');
        return;
      }
    }
    updateFilterUI();
  }

  function updateFilterUI() {
    // 태그 렌더링
    includeTagList.innerHTML = includeNumbers.length === 0
      ? '<span style="font-size:11px; opacity:0.6;">선택 없음</span>'
      : '';
    includeNumbers.forEach((n) => {
      const tag = document.createElement('span');
      tag.className = 'filter-tag include-tag';
      tag.innerHTML = `${n} &times;`;
      tag.addEventListener('click', function () {
        includeNumbers = includeNumbers.filter((x) => x !== n);
        updateFilterUI();
      });
      includeTagList.appendChild(tag);
    });

    excludeTagList.innerHTML = excludeNumbers.length === 0
      ? '<span style="font-size:11px; opacity:0.6;">선택 없음</span>'
      : '';
    excludeNumbers.forEach((n) => {
      const tag = document.createElement('span');
      tag.className = 'filter-tag exclude-tag';
      tag.innerHTML = `${n} &times;`;
      tag.addEventListener('click', function () {
        excludeNumbers = excludeNumbers.filter((x) => x !== n);
        updateFilterUI();
      });
      excludeTagList.appendChild(tag);
    });

    // 뱃지 업데이트
    if (includeNumbers.length > 0 || excludeNumbers.length > 0) {
      filterCountBadge.style.display = 'inline-block';
      filterCountBadge.textContent = `포함 ${includeNumbers.length} / 제외 ${excludeNumbers.length}`;
    } else {
      filterCountBadge.style.display = 'none';
    }

    renderNumberGrid();
  }

  // 필터 초기화
  btnResetFilter.addEventListener('click', function () {
    includeNumbers = [];
    excludeNumbers = [];
    updateFilterUI();
    showToast('포함/제외 번호가 초기화되었습니다.');
  });

  // 필터 아코디언 토글
  filterAccordionBtn.addEventListener('click', function () {
    isFilterOpen = !isFilterOpen;
    filterAccordionBody.style.display = isFilterOpen ? 'block' : 'none';
    filterArrow.textContent = isFilterOpen ? '▲' : '▼';
  });

  // 추천 기록 (히스토리)
  function loadHistory() {
    try {
      const saved = localStorage.getItem('lotto_recommend_history');
      if (saved) {
        history = JSON.parse(saved);
      }
    } catch {
      history = [];
    }
    renderHistory();
  }

  function addHistory(nums, label) {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    history.unshift({ nums, label, time });
    if (history.length > 50) history.pop();
    try {
      localStorage.setItem('lotto_recommend_history', JSON.stringify(history));
    } catch {
      // ignore
    }
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyCard.style.display = 'none';
      return;
    }
    historyCard.style.display = 'block';
    historyCount.textContent = `(${history.length})`;
    historyList.innerHTML = '';

    history.slice(0, 10).forEach((item) => {
      const el = document.createElement('div');
      el.className = 'history-item';

      const left = document.createElement('div');
      left.className = 'history-left';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'history-time';
      timeSpan.textContent = item.time;

      const labelBadge = document.createElement('span');
      labelBadge.style.fontSize = '10px';
      labelBadge.style.fontWeight = 'bold';
      labelBadge.style.padding = '2px 4px';
      labelBadge.style.borderRadius = '4px';
      labelBadge.style.backgroundColor = 'var(--sub-border)';
      labelBadge.textContent = item.label;

      const ballsDiv = document.createElement('div');
      ballsDiv.className = 'history-balls';
      item.nums.forEach((n) => {
        const b = document.createElement('div');
        b.className = `lotto-ball ${getBallClass(n)}`;
        b.textContent = n;
        ballsDiv.appendChild(b);
      });

      left.appendChild(timeSpan);
      left.appendChild(labelBadge);
      left.appendChild(ballsDiv);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn-icon';
      copyBtn.title = '복사';
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', function () {
        copyNumbers(item.nums, '기록 번호');
      });

      el.appendChild(left);
      el.appendChild(copyBtn);
      historyList.appendChild(el);
    });
  }

  btnClearHistory.addEventListener('click', function () {
    if (confirm('모든 추첨 기록을 삭제하시겠습니까?')) {
      history = [];
      localStorage.removeItem('lotto_recommend_history');
      renderHistory();
      showToast('모든 기록이 삭제되었습니다.');
    }
  });

  // 탭 전환 이벤트
  tabSingle.addEventListener('click', function () {
    currentTab = 'single';
    tabSingle.classList.add('active');
    tabBundle.classList.remove('active');
    singleCard.style.display = 'block';
    bundleCard.style.display = 'none';
  });

  tabBundle.addEventListener('click', function () {
    currentTab = 'bundle';
    tabBundle.classList.add('active');
    tabSingle.classList.remove('active');
    singleCard.style.display = 'none';
    bundleCard.style.display = 'block';
  });

  // 버튼 이벤트 연결
  btnRollSingle.addEventListener('click', rollSingle);
  btnCopySingle.addEventListener('click', function () {
    copyNumbers(singleNumbers, '단일 로또 번호');
  });

  btnRollBundle.addEventListener('click', rollBundle);
  btnCopyBundle.addEventListener('click', copyAllBundle);
  btnPrintBundle.addEventListener('click', function () {
    window.print();
  });

  // 제휴 문의 아코디언 토글 & 비동기 AJAX 폼 제출
  const contactAccordionBtn = document.getElementById('contactAccordionBtn');
  const contactAccordionBody = document.getElementById('contactAccordionBody');
  const contactArrow = document.getElementById('contactArrow');
  const partnershipForm = document.getElementById('partnershipForm');
  const btnSubmitContact = document.getElementById('btnSubmitContact');
  const contactStatus = document.getElementById('contactStatus');
  let isContactOpen = false;

  if (contactAccordionBtn && contactAccordionBody) {
    contactAccordionBtn.addEventListener('click', function () {
      isContactOpen = !isContactOpen;
      contactAccordionBody.style.display = isContactOpen ? 'block' : 'none';
      if (contactArrow) contactArrow.textContent = isContactOpen ? '▲' : '▼';
    });
  }

  if (partnershipForm) {
    partnershipForm.addEventListener('submit', function (e) {
      e.preventDefault();
      btnSubmitContact.disabled = true;
      btnSubmitContact.innerHTML = '<span>⏳</span> 전송 중입니다...';
      contactStatus.className = 'contact-status';
      contactStatus.style.display = 'none';

      const formData = new FormData(partnershipForm);

      fetch('https://formspree.io/f/meaorbjz', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(function (response) {
        if (response.ok) {
          contactStatus.textContent = '✅ 제휴 문의가 성공적으로 전송되었습니다! 확인 후 기재해주신 이메일로 신속히 답변드리겠습니다.';
          contactStatus.className = 'contact-status success';
          partnershipForm.reset();
          showToast('문의가 정상적으로 접수되었습니다.');
        } else {
          return response.json().then(function (data) {
            let errorMsg = '전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
            if (data && data.errors && data.errors.length > 0) {
              errorMsg = data.errors.map(function (err) { return err.message; }).join(', ');
            }
            contactStatus.textContent = '❌ ' + errorMsg;
            contactStatus.className = 'contact-status error';
          });
        }
      })
      .catch(function () {
        contactStatus.textContent = '❌ 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.';
        contactStatus.className = 'contact-status error';
      })
      .finally(function () {
        btnSubmitContact.disabled = false;
        btnSubmitContact.innerHTML = '<span>🚀</span> 문의 내용 전송하기';
      });
    });
  }

  // 스페이스바 키보드 단축키
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      if (currentTab === 'single') {
        rollSingle();
      } else {
        rollBundle();
      }
    }
  });

  // 초기 실행
  initTheme();
  renderSingleBalls(singleNumbers);
  renderBundle();
  updateFilterUI();
  loadHistory();
})();
