document.addEventListener('DOMContentLoaded', () => {
    const pugs = {
        common: [ { name: 'Мопс на лужайке', image: 'images/1.png' }, { name: 'Спокойный мопс', image: 'images/3.png' }, { name: 'Домашний мопс', image: 'images/6.png' } ],
        uncommon: [ { name: 'Мопс и Камаз', image: 'images/2.png' }, { name: 'Мопс и Камаз', image: 'images/5.png' } ],
        rare: [ { name: 'MC Pug', image: 'images/7.png' }, { name: 'Мопс-хакер', image: 'images/8.png' } ],
        epic: [ { name: 'Майор Мопс', image: 'images/4.png' } ],
        legendary: [ { name: 'Король Мопсов', image: 'images/10.png' } ],
        mystic: [ { name: 'Кибермопс 2077', image: 'images/9.png' } ]
    };

    const rarities = [
        { name: 'common', chance: 0.50, color: 'var(--rarity-common)', label: 'Обычный', sellPrice: 10 },
        { name: 'uncommon', chance: 0.25, color: 'var(--rarity-uncommon)', label: 'Необычный', sellPrice: 25 },
        { name: 'rare', chance: 0.15, color: 'var(--rarity-rare)', label: 'Редкий', sellPrice: 75 },
        { name: 'epic', chance: 0.07, color: 'var(--rarity-epic)', label: 'Эпический', sellPrice: 200 },
        { name: 'legendary', chance: 0.025, color: 'var(--rarity-legendary)', label: 'Легендарный', sellPrice: 500 },
        { name: 'mystic', chance: 0.005, color: 'var(--rarity-mystic)', label: 'Мифический', sellPrice: 2000 }
    ];

    const ROULETTE_LENGTH = 100;
    const CASE_PRICE = 100;
    const STARTING_BALANCE = 500;

    const logo = document.querySelector('.logo');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const goToRouletteBtn = document.getElementById('go-to-roulette-btn');
    const roulette = document.getElementById('roulette');
    const openCaseBtn = document.getElementById('open-case-btn');
    const resultModal = document.getElementById('result-modal');
    const resultRarity = document.getElementById('result-rarity');
    const resultName = document.getElementById('result-name');
    const resultImage = document.getElementById('result-image');
    const resultImageContainer = document.querySelector('.result-image-container');
    const balanceHeaderDisplay = document.getElementById('balance-header');
    const inventoryGrid = document.getElementById('inventory-grid');
    const inventoryEmptyMessage = document.getElementById('inventory-empty-message');
    const addBalanceBtn = document.getElementById('add-balance-btn');
    const addBalanceModal = document.getElementById('add-balance-modal');
    const balanceOptions = document.querySelector('.balance-options');
    const closeBalanceModalBtn = addBalanceModal.querySelector('.modal-close-btn');
    const claimItemBtn = document.getElementById('claim-item-btn');
    const sellItemBtn = document.getElementById('sell-item-btn');
    
    const buySound = document.getElementById('buy-sound');
    const openSound = document.getElementById('open-sound');
    const rollSound = document.getElementById('roll-sound');
    const saleSound = document.getElementById('sale-sound');
    const winSound = document.getElementById('win-sound');

    let balance = parseFloat(localStorage.getItem('pugBalance')) || STARTING_BALANCE;
    let inventory = JSON.parse(localStorage.getItem('pugInventory')) || [];
    let isSpinning = false;
    let currentItemInModal = null;

    function adjustHeadingFontSize() {
        const heading = document.querySelector('#home-page .hero-section h1');
        if (!heading) return;

        const container = heading.parentElement;
        heading.style.fontSize = ''; 
        let currentSize = parseFloat(window.getComputedStyle(heading).fontSize);
        const containerWidth = container.clientWidth;
        
        while (heading.scrollWidth > containerWidth && currentSize > 10) {
            currentSize--;
            heading.style.fontSize = `${currentSize}px`;
        }
    }

    function playSound(sound) {
        sound.currentTime = 0;
        sound.play();
    }

    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active-page'));
        const activePage = document.getElementById(`${pageId}-page`);
        activePage.classList.add('active-page');
        navLinks.forEach(link => { link.classList.toggle('active-link', link.dataset.page === pageId); });

        if (pageId === 'home') {
             setTimeout(adjustHeadingFontSize, 50);
        }
    }

    logo.addEventListener('click', () => showPage('home'));
    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); showPage(link.dataset.page); }); });
    goToRouletteBtn.addEventListener('click', () => showPage('roulette'));
    addBalanceBtn.addEventListener('click', () => addBalanceModal.classList.add('visible'));
    closeBalanceModalBtn.addEventListener('click', () => addBalanceModal.classList.remove('visible'));
    addBalanceModal.addEventListener('click', (e) => { if (e.target === addBalanceModal) addBalanceModal.classList.remove('visible'); });

    balanceOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('balance-option-btn')) {
            playSound(buySound);
            const amount = parseInt(e.target.dataset.amount);
            balance += amount;
            updateBalanceDisplay();
            checkButtonState();
            saveData();
            addBalanceModal.classList.remove('visible');
        }
    });

    function updateBalanceDisplay() { balanceHeaderDisplay.textContent = Math.round(balance); }
    function saveData() { localStorage.setItem('pugBalance', balance); localStorage.setItem('pugInventory', JSON.stringify(inventory)); }
    function checkButtonState() { openCaseBtn.classList.toggle('disabled', balance < CASE_PRICE || isSpinning); }

    function renderInventory() {
        if (inventory.length === 0) {
            inventoryGrid.style.display = 'none';
            inventoryEmptyMessage.style.display = 'block';
            return;
        }

        inventoryGrid.style.display = 'grid';
        inventoryEmptyMessage.style.display = 'none';
        inventoryGrid.innerHTML = '';

        inventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `inventory-item item-rarity-${item.rarity.name}`;
            const img = document.createElement('img');
            img.src = item.image;
            const name = document.createElement('p');
            name.className = 'inventory-item-name';
            name.textContent = item.name;
            const rarityLabel = document.createElement('p');
            rarityLabel.className = 'inventory-item-rarity';
            rarityLabel.textContent = item.rarity.label;
            rarityLabel.style.color = item.rarity.color;
            const sellBtn = document.createElement('button');
            sellBtn.className = 'sell-btn';
            sellBtn.textContent = `Продать за ${item.rarity.sellPrice}₽`;
            sellBtn.dataset.id = item.id;
            itemDiv.append(img, name, rarityLabel, sellBtn);
            inventoryGrid.appendChild(itemDiv);
        });
    }

    function sellItemFromInventory(itemId) {
        const itemIndex = inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        playSound(saleSound);
        const item = inventory[itemIndex];
        balance += item.rarity.sellPrice;
        inventory.splice(itemIndex, 1);
        updateBalanceDisplay();
        renderInventory();
        checkButtonState();
        saveData();
    }
    
    inventoryGrid.addEventListener('click', (e) => { if (e.target.classList.contains('sell-btn')) { sellItemFromInventory(parseInt(e.target.dataset.id)); } });

    function getRandomPug(rarityName) { return pugs[rarityName][Math.floor(Math.random() * pugs[rarityName].length)]; }

    function determineWinningPug() {
        const rand = Math.random();
        let cumulativeChance = 0;
        for (const rarity of rarities) {
            cumulativeChance += rarity.chance;
            if (rand < cumulativeChance) { return { ...getRandomPug(rarity.name), rarity }; }
        }
    }

    function createRouletteItem(pug, rarity) {
        const item = document.createElement('div');
        item.classList.add('roulette-item', `item-rarity-${rarity.name}`);
        const img = document.createElement('img');
        img.src = pug.image;
        img.alt = pug.name;
        const name = document.createElement('p');
        name.textContent = pug.name;
        item.appendChild(img);
        item.appendChild(name);
        return item;
    }

    function populateRoulette(winningItem) {
        roulette.innerHTML = '';
        for (let i = 0; i < ROULETTE_LENGTH; i++) {
            let item = i === ROULETTE_LENGTH - 10 ? winningItem : determineWinningPug();
            const rouletteElement = createRouletteItem(item, item.rarity);
            roulette.appendChild(rouletteElement);
        }
    }

    function prefillRoulette() {
        if (roulette.children.length > 0) return;
        roulette.innerHTML = '';
        for (let i = 0; i < ROULETTE_LENGTH; i++) {
            const item = determineWinningPug();
            const rouletteElement = createRouletteItem(item, item.rarity);
            roulette.appendChild(rouletteElement);
        }
    }

    function showResult(item) {
        currentItemInModal = { ...item, id: Date.now() };
        resultRarity.textContent = currentItemInModal.rarity.label;
        resultRarity.style.color = currentItemInModal.rarity.color;
        resultName.textContent = currentItemInModal.name;
        resultImage.src = currentItemInModal.image;
        resultImageContainer.className = 'result-image-container';
        resultImageContainer.classList.add(`glow-${currentItemInModal.rarity.name}`);
        sellItemBtn.textContent = `Продать за ${currentItemInModal.rarity.sellPrice}₽`;
        resultModal.classList.add('visible');
    }

    function closeResultModal() {
        resultModal.classList.remove('visible');
        isSpinning = false;
        navLinks.forEach(link => link.classList.remove('disabled'));
        logo.classList.remove('disabled');
        checkButtonState();
        currentItemInModal = null;
    }

    claimItemBtn.addEventListener('click', () => {
        if (!currentItemInModal) return;
        playSound(openSound);
        inventory.push(currentItemInModal);
        renderInventory();
        saveData();
        closeResultModal();
    });

    sellItemBtn.addEventListener('click', () => {
        if (!currentItemInModal) return;
        playSound(saleSound);
        balance += currentItemInModal.rarity.sellPrice;
        updateBalanceDisplay();
        saveData();
        closeResultModal();
    });

    function openCase() {
        if (balance < CASE_PRICE || isSpinning) return;
        playSound(openSound);
        isSpinning = true;
        navLinks.forEach(link => link.classList.add('disabled'));
        logo.classList.add('disabled');
        balance -= CASE_PRICE;
        updateBalanceDisplay();
        checkButtonState();
        saveData();

        const winningItem = determineWinningPug();
        populateRoulette(winningItem);

        const firstItem = roulette.firstChild;
        if (!firstItem) return;
        const itemStyle = window.getComputedStyle(firstItem);
        const itemWidth = firstItem.offsetWidth + parseInt(itemStyle.marginLeft) + parseInt(itemStyle.marginRight);
        
        const targetPosition = (ROULETTE_LENGTH - 10) * itemWidth;
        const containerWidth = roulette.parentElement.offsetWidth;
        const randomOffset = (Math.random() - 0.5) * itemWidth * 0.8;
        const finalPosition = -targetPosition + (containerWidth / 2) - (itemWidth / 2) + randomOffset;

        roulette.style.transition = 'none';
        roulette.style.transform = 'translateX(0)';

        setTimeout(() => {
            roulette.style.transition = 'transform 6s cubic-bezier(0.2, 0.8, 0.2, 1)';
            roulette.style.transform = `translateX(${finalPosition}px)`;
            playSound(rollSound);
        }, 50);

        roulette.addEventListener('transitionend', () => {
            playSound(winSound);
            showResult(winningItem);
        }, { once: true });
    }

    function handleViewportHeight() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    openCaseBtn.addEventListener('click', openCase);
    
    window.addEventListener('resize', () => {
        handleViewportHeight();
        adjustHeadingFontSize();
    });

    handleViewportHeight();
    updateBalanceDisplay();
    renderInventory();
    checkButtonState();
    prefillRoulette();
    showPage('home');
});