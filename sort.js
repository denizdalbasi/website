let array = [];
let comparisons = 0;
let swaps = 0;
const container = document.getElementById('container');

function generateArray(size = 40) {
    array = [];
    container.innerHTML = '';
    comparisons = 0;
    swaps = 0;
    updateStats();

    for (let i = 0; i < size; i++) {
        const val = Math.floor(Math.random() * 250) + 10;
        array.push(val);
        const bar = document.createElement('div');
        bar.style.height = `${val}px`;
        bar.classList.add('bar');
        bar.id = `bar-${i}`;
        container.appendChild(bar);
    }
}

function updateStats() {
    document.getElementById('comp-count').innerText = comparisons;
    document.getElementById('swap-count').innerText = swaps;
}

// The "Engineering" Pause
function sleep() {
    const ms = 101 - document.getElementById('speed').value;
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function swap(i, j) {
    swaps++;
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;

    // Visual Update
    const barI = document.getElementById(`bar-${i}`);
    const barJ = document.getElementById(`bar-${j}`);
    barI.style.height = `${array[i]}px`;
    barJ.style.height = `${array[j]}px`;
    
    barI.style.backgroundColor = 'var(--compare-color)';
    barJ.style.backgroundColor = 'var(--compare-color)';
    
    await sleep();
    
    barI.style.backgroundColor = 'var(--bar-color)';
    barJ.style.backgroundColor = 'var(--bar-color)';
    updateStats();
}

// --- Algorithms ---

async function bubbleSort() {
    document.getElementById('current-algo').innerText = "BUBBLE SORT";
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length - i - 1; j++) {
            comparisons++;
            if (array[j] > array[j+1]) {
                await swap(j, j+1);
            }
        }
    }
}

async function quickSort(start, end) {
    if (start >= end) return;
    document.getElementById('current-algo').innerText = "QUICK SORT";
    
    let index = await partition(start, end);
    await Promise.all([
        quickSort(start, index - 1),
        quickSort(index + 1, end)
    ]);
}

async function partition(start, end) {
    let pivotIndex = start;
    let pivotValue = array[end];
    for (let i = start; i < end; i++) {
        comparisons++;
        if (array[i] < pivotValue) {
            await swap(i, pivotIndex);
            pivotIndex++;
        }
    }
    await swap(pivotIndex, end);
    return pivotIndex;
}

async function startSort() {
    const algo = document.getElementById('algo-select').value;
    document.getElementById('start-btn').disabled = true;
    
    if (algo === 'bubble') await bubbleSort();
    if (algo === 'quick') await quickSort(0, array.length - 1);
    
    // Mark everything green (Sorted)
    document.querySelectorAll('.bar').forEach(b => b.style.backgroundColor = 'var(--sorted-color)');
    document.getElementById('start-btn').disabled = false;
}

let isRunning = false;
let stopRequested = false;

function stopSort() {
    if (isRunning) {
        stopRequested = true;
        document.getElementById('sys-state').innerText = "ABORTING...";
    }
}

// Update your sleep function to check for the stop signal
function sleep() {
    return new Promise((resolve, reject) => {
        const ms = 101 - document.getElementById('speed').value;
        setTimeout(() => {
            if (stopRequested) {
                isRunning = false;
                document.getElementById('start-btn').disabled = false;
                // We throw an error to break out of the recursion/loops immediately
                throw new Error("User Abort"); 
            }
            resolve();
        }, ms);
    });
}
async function insertionSort() {
    document.getElementById('current-algo').innerText = "INSERTION SORT";
    for (let i = 1; i < array.length; i++) {
        let key = array[i];
        let j = i - 1;
        while (j >= 0 && array[j] > key) {
            comparisons++;
            await swap(j + 1, j);
            j = j - 1;
        }
        array[j + 1] = key;
    }
}
async function mergeSort(l, r) {
    if (l >= r) return;
    const m = l + Math.floor((r - l) / 2);
    await mergeSort(l, m);
    await mergeSort(m + 1, r);
    await merge(l, m, r);
}

async function merge(l, m, r) {
    let n1 = m - l + 1;
    let n2 = r - m;
    let L = array.slice(l, m + 1);
    let R = array.slice(m + 1, r + 1);

    let i = 0, j = 0, k = l;
    
    while (i < n1 && j < n2) {
        // --- THE FIX: Increment comparisons here ---
        comparisons++; 
        updateStats(); // Update the UI immediately

        // Visual Feedback: Highlight the bars being compared
        const barI = document.getElementById(`bar-${l + i}`);
        const barJ = document.getElementById(`bar-${m + 1 + j}`);
        if (barI) barI.style.backgroundColor = 'var(--compare-color)';
        if (barJ) barJ.style.backgroundColor = 'var(--compare-color)';

        await sleep();

        if (L[i] <= R[j]) {
            array[k] = L[i];
            i++;
        } else {
            array[k] = R[j];
            j++;
        }

        // Reset colors and update the merged bar
        if (barI) barI.style.backgroundColor = 'var(--bar-color)';
        if (barJ) barJ.style.backgroundColor = 'var(--bar-color)';
        
        const mergedBar = document.getElementById(`bar-${k}`);
        mergedBar.style.height = `${array[k]}px`;
        mergedBar.style.backgroundColor = 'var(--accent)'; // Show it's being placed
        
        k++;
    }

    // Copy remaining elements (No comparisons happen here, just data movement)
    while (i < n1) { 
        array[k] = L[i]; 
        updateBar(k); 
        i++; k++; 
        await sleep(); 
    }
    while (j < n2) { 
        array[k] = R[j]; 
        updateBar(k); 
        j++; k++; 
        await sleep(); 
    }
}

function updateBar(k) {
    const bar = document.getElementById(`bar-${k}`);
    bar.style.height = `${array[k]}px`;
}async function startSort() {
    const algo = document.getElementById('algo-select').value;
    document.getElementById('start-btn').disabled = true;
    isRunning = true;
    stopRequested = false;

    try {
        if (algo === 'bubble') await bubbleSort();
        if (algo === 'insertion') await insertionSort();
        if (algo === 'quick') await quickSort(0, array.length - 1);
        if (algo === 'merge') await mergeSort(0, array.length - 1);
        
        document.querySelectorAll('.bar').forEach(b => b.style.backgroundColor = 'var(--sorted-color)');
    } catch (e) {
        console.log("Sort stopped by user.");
    } finally {
        isRunning = false;
        document.getElementById('start-btn').disabled = false;
    }
}

generateArray();