// DOM Elements
const unitToggleBtns = document.querySelectorAll('.unit-btn');
const metricInputGroup = document.querySelector('.input-group.metric');
const imperialInputGroup = document.querySelector('.input-group.imperial');
const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const feetInput = document.getElementById('feet');
const inchesInput = document.getElementById('inches');
const poundsInput = document.getElementById('pounds');
const calculateBtn = document.getElementById('calculate-btn');
const errorMessageContainer = document.querySelector('.error-message-container'); // Container for errors
const resultSection = document.getElementById('result-section');
const bmiValueElement = document.getElementById('bmi-value');
const bmiCategoryElement = document.getElementById('bmi-category');
const indicatorElement = document.getElementById('indicator');
const recommendationElement = document.getElementById('recommendation');
const dateCalculatedElement = document.getElementById('date-calculated');
const saveResultBtn = document.getElementById('save-result');
const historyListElement = document.getElementById('history-list');

// Current measurement unit and results
let currentUnit = 'metric';
let lastCalculatedBMI = null;
let lastCalculatedCategory = null;
let errorTimeout = null; // To manage error message display

// BMI categories and thresholds
const BMI_CATEGORIES = {
  underweight: {
    max: 18.5,
    label: 'Underweight',
    color: 'var(--color-underweight)',
    recommendation: 'Consider consulting with a healthcare professional about healthy weight gain strategies and ensuring adequate nutrition.'
  },
  normal: {
    min: 18.5,
    max: 24.9,
    label: 'Normal weight',
    color: 'var(--color-normal)',
    recommendation: 'Maintain your healthy lifestyle with balanced nutrition and regular physical activity.'
  },
  overweight: {
    min: 25,
    max: 29.9,
    label: 'Overweight',
    color: 'var(--color-warning)',
    recommendation: 'Focus on balanced nutrition and increasing physical activity. Small lifestyle changes can make a significant difference.'
  },
  obese: {
    min: 30,
    label: 'Obese',
    color: 'var(--color-error)',
    recommendation: 'Consider consulting with a healthcare professional for personalized advice on weight management strategies.'
  }
};

// History storage
let bmiHistory = JSON.parse(localStorage.getItem('bmiHistory')) || [];

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  // Unit toggle
  unitToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setUnit(btn.dataset.unit);
      clearInputsAndErrors(); // Clear inputs when unit changes
      hideResult(); // Hide result when unit changes
    });
  });

  // Calculate BMI
  calculateBtn.addEventListener('click', handleCalculation);

  // Save result
  saveResultBtn.addEventListener('click', saveResult);

  // Load initial history
  renderHistory();

  // Add input validation feedback on input change
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
      validateInput(input); // Visually validate on input
    });
    // Clear errors also on focus
    input.addEventListener('focus', () => {
        input.classList.remove('error');
        clearInputError(); // Clear general message if user starts typing
    });
  });
});

// --- Functions ---

// Switch between metric and imperial units
function setUnit(unit) {
  currentUnit = unit;

  // Update toggle buttons UI
  unitToggleBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.unit === unit);
  });

  // Show/hide relevant input groups
  metricInputGroup.classList.toggle('hidden', unit !== 'metric');
  imperialInputGroup.classList.toggle('hidden', unit !== 'imperial');
}

// Clear all input fields
function clearInputs() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = '';
    });
}

// Clear input visual error states
function clearInputErrors() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.classList.remove('error');
    });
    clearInputError(); // Clear the general message as well
}
// ghfjdksl
// Clear inputs and errors together
function clearInputsAndErrors() {
    clearInputs();
    clearInputErrors();
}

// gfdsa
// Validate a single numeric input visually
function validateInput(input) {
  const value = parseFloat(input.value);
  let isValid = true;

  // Allow empty input initially, but mark as error if <= 0 when non-empty
  if (input.value.trim() !== '' && (isNaN(value) || value <= 0)) {
    input.classList.add('error');
    isValid = false;
  } else {
    input.classList.remove('error');
  }
  return isValid;
}

// Validate all relevant inputs before calculation
function validateAllInputs() {
    let allValid = true;
    clearInputErrors(); // Clear previous errors first

    if (currentUnit === 'metric') {
        if (!validateInput(heightInput)) allValid = false;
        if (!validateInput(weightInput)) allValid = false;
        if (!heightInput.value || !weightInput.value) allValid = false; // Ensure fields are not empty
    } else { // Imperial
        const feetValue = feetInput.value.trim();
        const inchesValue = inchesInput.value.trim();
        const poundsValue = poundsInput.value.trim();

        // Validate individual fields if they have values
        if (feetValue && !validateInput(feetInput)) allValid = false;
        if (inchesValue && !validateInput(inchesInput)) allValid = false;
        if (!validateInput(poundsInput)) allValid = false; // Weight is mandatory

        // Check if height (either feet or inches) and weight are provided and valid
        const totalInches = (parseFloat(feetValue) || 0) * 12 + (parseFloat(inchesValue) || 0);
        if (totalInches <= 0 || !poundsValue || parseFloat(poundsValue) <= 0) {
             // Mark relevant fields as error if height/weight is missing/invalid
            if (totalInches <= 0) {
                if (!feetValue && !inchesValue) { // Mark both if both empty
                   feetInput.classList.add('error');
                   inchesInput.classList.add('error');
                } else { // Mark only the one causing issue if partially filled
                    if (feetValue && parseFloat(feetValue) < 0) feetInput.classList.add('error');
                    if (inchesValue && parseFloat(inchesValue) < 0) inchesInput.classList.add('error');
                }
            }
            if (!poundsValue || parseFloat(poundsValue) <= 0) {
                poundsInput.classList.add('error');
            }
            allValid = false;
        }
    }

    if (!allValid) {
        showInputError('Please enter valid positive numbers for all required fields.');
    }
    return allValid;
}

// Handle the calculation process
function handleCalculation() {
    if (!validateAllInputs()) {
        // Shake button only if validation fails
        calculateBtn.classList.add('shake');
        setTimeout(() => calculateBtn.classList.remove('shake'), 500);
        return; // Stop calculation if validation fails
    }

    let bmi;
    if (currentUnit === 'metric') {
        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);
        // BMI formula: weight (kg) / (height (m))²
        bmi = weight / Math.pow(height / 100, 2);
    } else { // Imperial
        const feet = parseFloat(feetInput.value) || 0;
        const inches = parseFloat(inchesInput.value) || 0;
        const pounds = parseFloat(poundsInput.value);
        const totalInches = (feet * 12) + inches;
        // BMI formula for imperial: (weight (lb) / (height (in))²) × 703
        bmi = (pounds / Math.pow(totalInches, 2)) * 703;
    }

    displayResult(bmi);
}


// Show error message for invalid inputs
function showInputError(message) {
  // Clear any existing timeout to prevent message flickering
  if (errorTimeout) {
    clearTimeout(errorTimeout);
  }
  // Clear previous message content
  errorMessageContainer.innerHTML = '';

  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = message;
  errorMessageContainer.appendChild(errorMessage);

  // Remove error message after a delay
  errorTimeout = setTimeout(() => {
    errorMessageContainer.innerHTML = ''; // Clear the container
    errorTimeout = null;
  }, 3000);
}

// Clear the general error message immediately
function clearInputError() {
    if (errorTimeout) {
        clearTimeout(errorTimeout);
        errorTimeout = null;
    }
    errorMessageContainer.innerHTML = '';
}

// Display the BMI result
function displayResult(bmi) {
  bmi = Math.round(bmi * 10) / 10; // Round to one decimal place
  const category = getBMICategory(bmi);

  // Update result elements
  bmiValueElement.textContent = bmi.toFixed(1);
  bmiValueElement.style.color = category.color;
  bmiCategoryElement.textContent = category.label;
  bmiCategoryElement.style.color = category.color;
  recommendationElement.textContent = category.recommendation;

  updateScaleIndicator(bmi);

  const now = new Date();
  dateCalculatedElement.textContent = now.toLocaleDateString();

  // Store for potential save
  lastCalculatedBMI = bmi;
  lastCalculatedCategory = category;

  // Show result section with animation (if CSS is set up for it)
  resultSection.classList.remove('hidden');
  resultSection.classList.add('visible'); // Add class for potential animation trigger

  // Optional: Scroll to result section smoothly
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide the result section
function hideResult() {
    resultSection.classList.add('hidden');
    resultSection.classList.remove('visible');
    lastCalculatedBMI = null; // Reset last calculation
    lastCalculatedCategory = null;
}

// Determine BMI category based on value
function getBMICategory(bmi) {
  if (bmi < BMI_CATEGORIES.underweight.max) {
    return BMI_CATEGORIES.underweight;
  } else if (bmi < BMI_CATEGORIES.normal.max) { // Use < for max threshold
    return BMI_CATEGORIES.normal;
  } else if (bmi < BMI_CATEGORIES.overweight.max) { // Use < for max threshold
    return BMI_CATEGORIES.overweight;
  } else { // BMI >= 30
    return BMI_CATEGORIES.obese;
  }
}

// Update the position of the indicator on the BMI scale
function updateScaleIndicator(bmi) {
  let positionPercent;
  const minBMI = 10; // Lower bound for scale visualization
  const maxBMI = 40; // Upper bound for scale visualization

  if (bmi < minBMI) {
    positionPercent = 0;
  } else if (bmi > maxBMI) {
    positionPercent = 100;
  } else {
    // Map BMI range (minBMI-maxBMI) to position (0-100%)
    positionPercent = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;
  }

  // Ensure position is within 0-100%
  positionPercent = Math.max(0, Math.min(100, positionPercent));

  // Update indicator style
  indicatorElement.style.left = `${positionPercent}%`;
  const category = getBMICategory(bmi);
  indicatorElement.style.borderColor = category.color;
}

// Save current result to history
function saveResult() {
  if (lastCalculatedBMI === null || lastCalculatedCategory === null) return; // Nothing to save

  const historyItem = {
    id: Date.now(), // Unique ID based on timestamp
    date: new Date().toLocaleDateString(),
    bmi: lastCalculatedBMI,
    category: lastCalculatedCategory.label
  };

  // Add to beginning of history array
  bmiHistory.unshift(historyItem);

  // Limit history size (e.g., keep last 10)
  const maxHistory = 10;
  if (bmiHistory.length > maxHistory) {
    bmiHistory = bmiHistory.slice(0, maxHistory);
  }

  // Save to localStorage
  localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));

  // Update history display
  renderHistory();

  // Show confirmation feedback on button
  saveResultBtn.textContent = 'Saved!';
  saveResultBtn.classList.add('saved');
  saveResultBtn.disabled = true; // Disable temporarily

  setTimeout(() => {
    saveResultBtn.textContent = 'Save Result';
    saveResultBtn.classList.remove('saved');
    saveResultBtn.disabled = false; // Re-enable
  }, 2000);
}

// Render history list from the bmiHistory array
function renderHistory() {
  // Clear current list
  historyListElement.innerHTML = '';

  if (bmiHistory.length === 0) {
    historyListElement.innerHTML = '<p class="empty-history">No saved records yet.</p>';
    return;
  }

  bmiHistory.forEach(item => {
    const historyElement = document.createElement('div');
    historyElement.className = 'history-item';
    historyElement.dataset.id = item.id;

    // Find the corresponding category color
    let categoryColor = 'var(--color-text)'; // Default color
    for (const key in BMI_CATEGORIES) {
      if (BMI_CATEGORIES[key].label === item.category) {
        categoryColor = BMI_CATEGORIES[key].color;
        break;
      }
    }

    historyElement.innerHTML = `
      <span class="history-date">${item.date}</span>
      <div class="history-result">
        <span class="history-value" style="color: ${categoryColor}">${item.bmi.toFixed(1)}</span>
        <span class="history-category" style="color: ${categoryColor}">${item.category}</span>
        <button type="button" class="delete-history" aria-label="Delete record ${item.date} - BMI ${item.bmi.toFixed(1)}">×</button>
      </div>
    `;

    historyListElement.appendChild(historyElement);

    // Add event listener for the delete button
    historyElement.querySelector('.delete-history').addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent potential parent clicks
      deleteHistoryItem(item.id);
    });
  });
}

// Delete history item by ID
function deleteHistoryItem(id) {
  // Find the DOM element to animate its removal
  // Corrected querySelector syntax
  const itemElement = historyListElement.querySelector(`.history-item[data-id="${id}"]`);

  // Animate removal if element exists
  if (itemElement) {
    itemElement.style.opacity = '0';
    itemElement.style.height = '0';
    itemElement.style.paddingTop = '0';
    itemElement.style.paddingBottom = '0';
    itemElement.style.marginTop = '0';
    itemElement.style.marginBottom = '0';
    itemElement.style.borderWidth = '0'; // Hide border during animation

    // Remove from array and re-render after animation completes
    setTimeout(() => {
      bmiHistory = bmiHistory.filter(item => item.id !== id);
      localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));
      renderHistory(); // Re-render the list without the deleted item
    }, 300); // Match transition duration in CSS
  } else {
      // If element not found (e.g., quick multi-clicks), just update data and render
      bmiHistory = bmiHistory.filter(item => item.id !== id);
      localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));
      renderHistory();
  }
}
