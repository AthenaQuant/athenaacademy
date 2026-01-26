/**
 * ============================================
 * Quantitative Trading Modules - Shared Scripts
 * Modern JavaScript (ES6+) for Interactive Features
 * ============================================
 */

// ============================================
// Global State Management
// ============================================
const AppState = {
  quizScores: {},
  calculatorResults: {},
  copiedButtons: new Set(),
};

// ============================================
// 1. COPY BUTTON FUNCTIONALITY
// ============================================

/**
 * Initialize copy buttons for all code blocks
 * Automatically finds all code blocks and adds copy functionality
 */
function initializeCopyButtons() {
  const codeBlocks = document.querySelectorAll('.code-block');

  codeBlocks.forEach((block, index) => {
    // Check if copy button already exists
    if (block.querySelector('.copy-btn')) return;

    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="copy-text">Copy</span>
    `;

    // Add click event
    copyBtn.addEventListener('click', () => copyCodeToClipboard(block, copyBtn));

    // Insert button into code header or create one
    let header = block.querySelector('.code-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'code-header';
      header.innerHTML = `
        <div class="traffic-lights">
          <div class="traffic-light red"></div>
          <div class="traffic-light yellow"></div>
          <div class="traffic-light green"></div>
        </div>
      `;
      block.insertBefore(header, block.firstChild);
    }

    header.appendChild(copyBtn);
  });
}

/**
 * Copy code content to clipboard with visual feedback
 * @param {HTMLElement} codeBlock - The code block element
 * @param {HTMLElement} button - The copy button element
 */
async function copyCodeToClipboard(codeBlock, button) {
  try {
    // Get code content
    const codeContent = codeBlock.querySelector('pre code, .code-content pre, .code-content code');
    const textToCopy = codeContent ? codeContent.textContent : codeBlock.textContent;

    // Copy to clipboard
    await navigator.clipboard.writeText(textToCopy.trim());

    // Visual feedback
    showCopySuccess(button);

  } catch (err) {
    // Fallback for older browsers
    fallbackCopyToClipboard(codeBlock, button);
  }
}

/**
 * Show success feedback when code is copied
 * @param {HTMLElement} button - The copy button element
 */
function showCopySuccess(button) {
  const originalHTML = button.innerHTML;
  const buttonId = button.dataset.id || Math.random().toString(36);
  button.dataset.id = buttonId;

  // Prevent multiple simultaneous copies
  if (AppState.copiedButtons.has(buttonId)) return;
  AppState.copiedButtons.add(buttonId);

  // Change button appearance
  button.classList.add('copied');
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span class="copy-text">Copied!</span>
  `;
  button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

  // Reset after 2 seconds
  setTimeout(() => {
    button.classList.remove('copied');
    button.innerHTML = originalHTML;
    button.style.background = '';
    AppState.copiedButtons.delete(buttonId);
  }, 2000);
}

/**
 * Fallback copy method for older browsers
 * @param {HTMLElement} codeBlock - The code block element
 * @param {HTMLElement} button - The copy button element
 */
function fallbackCopyToClipboard(codeBlock, button) {
  const codeContent = codeBlock.querySelector('pre code, .code-content pre, .code-content code');
  const textArea = document.createElement('textarea');
  textArea.value = codeContent ? codeContent.textContent : codeBlock.textContent;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    showCopySuccess(button);
  } catch (err) {
    console.error('Failed to copy code:', err);
    button.innerHTML = '<span class="copy-text">Failed</span>';
    setTimeout(() => {
      button.innerHTML = '<span class="copy-text">Copy</span>';
    }, 2000);
  }

  document.body.removeChild(textArea);
}

// ============================================
// 2. QUIZ VALIDATION SYSTEM
// ============================================

/**
 * Initialize all quiz containers on the page
 */
function initializeQuizzes() {
  const quizContainers = document.querySelectorAll('.quiz-container');

  quizContainers.forEach((quiz, index) => {
    const quizId = quiz.dataset.quizId || `quiz-${index}`;
    quiz.dataset.quizId = quizId;

    // Initialize score tracking
    if (!AppState.quizScores[quizId]) {
      AppState.quizScores[quizId] = {
        total: 0,
        correct: 0,
        answered: new Set(),
      };
    }

    // Add event listeners to quiz options
    const options = quiz.querySelectorAll('.quiz-option');
    options.forEach(option => {
      option.addEventListener('click', () => handleQuizAnswer(quiz, option));
    });

    // Add event listeners to submit buttons
    const submitBtn = quiz.querySelector('.quiz-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => handleQuizSubmit(quiz));
    }
  });
}

/**
 * Handle quiz answer selection (multiple choice)
 * @param {HTMLElement} quizContainer - The quiz container element
 * @param {HTMLElement} selectedOption - The selected option element
 */
function handleQuizAnswer(quizContainer, selectedOption) {
  const quizId = quizContainer.dataset.quizId;
  const questionId = selectedOption.closest('.quiz-question-group')?.dataset.questionId || 'default';
  const isCorrect = selectedOption.dataset.correct === 'true';

  // Get all options in this question
  const allOptions = selectedOption.closest('.quiz-options')?.querySelectorAll('.quiz-option') ||
                      quizContainer.querySelectorAll('.quiz-option');

  // Remove previous selections
  allOptions.forEach(opt => {
    opt.classList.remove('correct', 'incorrect', 'selected');
  });

  // Mark selected option
  selectedOption.classList.add('selected');

  // Show feedback
  if (isCorrect) {
    selectedOption.classList.add('correct');
    showQuizFeedback(quizContainer, true, selectedOption.dataset.explanation);
    updateQuizScore(quizId, questionId, true);
  } else {
    selectedOption.classList.add('incorrect');
    // Optionally show the correct answer
    const correctOption = Array.from(allOptions).find(opt => opt.dataset.correct === 'true');
    if (correctOption) {
      correctOption.classList.add('correct');
    }
    showQuizFeedback(quizContainer, false, selectedOption.dataset.explanation);
    updateQuizScore(quizId, questionId, false);
  }

  // Disable all options after answer
  allOptions.forEach(opt => {
    opt.style.pointerEvents = 'none';
  });
}

/**
 * Handle quiz text input submission
 * @param {HTMLElement} quizContainer - The quiz container element
 */
function handleQuizSubmit(quizContainer) {
  const quizId = quizContainer.dataset.quizId;
  const input = quizContainer.querySelector('.quiz-input');
  const correctAnswer = input?.dataset.correctAnswer;
  const userAnswer = input?.value.trim().toLowerCase();
  const questionId = input?.dataset.questionId || 'input-question';

  if (!input || !correctAnswer) return;

  // Check if answer is correct (case-insensitive)
  const isCorrect = userAnswer === correctAnswer.toLowerCase();

  // Show feedback
  if (isCorrect) {
    input.classList.add('correct');
    input.style.borderColor = '#10b981';
    input.style.background = 'rgba(16, 185, 129, 0.1)';
    showQuizFeedback(quizContainer, true, input.dataset.explanation);
    updateQuizScore(quizId, questionId, true);
  } else {
    input.classList.add('incorrect');
    input.style.borderColor = '#ef4444';
    input.style.background = 'rgba(239, 68, 68, 0.1)';
    showQuizFeedback(quizContainer, false, input.dataset.explanation || `Correct answer: ${correctAnswer}`);
    updateQuizScore(quizId, questionId, false);
  }

  // Disable input
  input.disabled = true;
  const submitBtn = quizContainer.querySelector('.quiz-submit');
  if (submitBtn) submitBtn.disabled = true;
}

/**
 * Show quiz feedback message
 * @param {HTMLElement} quizContainer - The quiz container element
 * @param {boolean} isCorrect - Whether the answer is correct
 * @param {string} explanation - Optional explanation text
 */
function showQuizFeedback(quizContainer, isCorrect, explanation = '') {
  // Remove existing feedback
  const existingFeedback = quizContainer.querySelector('.quiz-feedback');
  if (existingFeedback) existingFeedback.remove();

  // Create new feedback
  const feedback = document.createElement('div');
  feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;

  const icon = isCorrect ? '✓' : '✗';
  const message = isCorrect ? 'Correct!' : 'Incorrect';
  const color = isCorrect ? '#10b981' : '#ef4444';

  feedback.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
      <span style="font-size: 1.5rem; color: ${color};">${icon}</span>
      <strong style="color: ${color}; font-size: 1.1rem;">${message}</strong>
    </div>
    ${explanation ? `<p style="color: var(--text-secondary); margin: 0;">${explanation}</p>` : ''}
  `;

  feedback.style.background = isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
  feedback.style.borderLeft = `4px solid ${color}`;

  quizContainer.appendChild(feedback);

  // Smooth scroll to feedback
  feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Update quiz score and display
 * @param {string} quizId - The quiz identifier
 * @param {string} questionId - The question identifier
 * @param {boolean} isCorrect - Whether the answer is correct
 */
function updateQuizScore(quizId, questionId, isCorrect) {
  const scoreData = AppState.quizScores[quizId];

  // Only count each question once
  if (!scoreData.answered.has(questionId)) {
    scoreData.total++;
    if (isCorrect) {
      scoreData.correct++;
    }
    scoreData.answered.add(questionId);
  }

  // Update score display
  const scoreDisplay = document.querySelector(`[data-quiz-id="${quizId}"] .quiz-score`);
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${scoreData.correct}/${scoreData.total}`;
    scoreDisplay.style.color = scoreData.correct === scoreData.total ? '#10b981' : '#3b82f6';
  }

  // Check if all questions answered correctly
  checkQuizCompletion(quizId);
}

/**
 * Check if quiz is complete and show celebration
 * @param {string} quizId - The quiz identifier
 */
function checkQuizCompletion(quizId) {
  const scoreData = AppState.quizScores[quizId];
  const quizContainer = document.querySelector(`[data-quiz-id="${quizId}"]`);

  if (!quizContainer) return;

  const totalQuestions = quizContainer.querySelectorAll('.quiz-option[data-correct], .quiz-input[data-correct-answer]').length;

  if (scoreData.correct === totalQuestions && scoreData.correct > 0) {
    showCelebration(quizContainer);
  }
}

/**
 * Show celebration message for quiz completion
 * @param {HTMLElement} quizContainer - The quiz container element
 */
function showCelebration(quizContainer) {
  // Remove existing celebration
  const existing = quizContainer.querySelector('.quiz-celebration');
  if (existing) existing.remove();

  const celebration = document.createElement('div');
  celebration.className = 'quiz-celebration';
  celebration.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      text-align: center;
      margin-top: 1rem;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
      animation: fadeIn 0.5s ease;
    ">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
      <div style="font-size: 1.25rem; font-weight: 600;">Perfect Score!</div>
      <div style="font-size: 0.95rem; opacity: 0.9; margin-top: 0.25rem;">
        You've mastered this concept!
      </div>
    </div>
  `;

  quizContainer.appendChild(celebration);

  // Confetti effect (optional)
  triggerConfetti();
}

/**
 * Trigger confetti animation (simple version)
 */
function triggerConfetti() {
  // Simple confetti effect - can be enhanced with a library like canvas-confetti
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.top = '-10px';
      confetti.style.opacity = '1';
      confetti.style.borderRadius = '50%';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '9999';

      document.body.appendChild(confetti);

      const duration = 2000 + Math.random() * 1000;
      const xMovement = (Math.random() - 0.5) * 200;

      confetti.animate([
        { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight}px) translateX(${xMovement}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });

      setTimeout(() => confetti.remove(), duration);
    }, i * 30);
  }
}

// ============================================
// 3. CALCULATOR FUNCTIONS
// ============================================

/**
 * Initialize all calculator widgets on the page
 */
function initializeCalculators() {
  const calculators = document.querySelectorAll('.calculator-widget');

  calculators.forEach((calculator, index) => {
    const calcId = calculator.dataset.calcId || `calc-${index}`;
    calculator.dataset.calcId = calcId;

    // Add input event listeners
    const inputs = calculator.querySelectorAll('.calculator-input');
    inputs.forEach(input => {
      input.addEventListener('input', () => handleCalculatorInput(calculator));
      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleCalculatorInput(calculator);
      });
    });

    // Add button listeners
    const calculateBtn = calculator.querySelector('.calculator-btn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => handleCalculatorInput(calculator));
    }
  });
}

/**
 * Handle calculator input and update results
 * @param {HTMLElement} calculator - The calculator widget element
 */
function handleCalculatorInput(calculator) {
  const calcType = calculator.dataset.calcType;

  // Get all inputs
  const inputs = {};
  calculator.querySelectorAll('.calculator-input').forEach(input => {
    const name = input.name || input.dataset.name;
    inputs[name] = parseFloat(input.value) || 0;
  });

  // Calculate result based on calculator type
  let result;
  switch (calcType) {
    case 'roi':
      result = calculateROI(inputs.initial, inputs.final);
      break;
    case 'sharpe':
      result = calculateSharpeRatio(inputs.returns, inputs.riskFree, inputs.stdDev);
      break;
    case 'compound':
      result = calculateCompoundGrowth(inputs.principal, inputs.rate, inputs.time);
      break;
    case 'var':
      result = calculateVaR(inputs.value, inputs.confidence, inputs.volatility);
      break;
    default:
      // Custom calculation function
      const calcFunction = calculator.dataset.calcFunction;
      if (calcFunction && window[calcFunction]) {
        result = window[calcFunction](inputs);
      }
  }

  // Display result
  displayCalculatorResult(calculator, result);
}

/**
 * Calculate Return on Investment (ROI)
 * @param {number} initial - Initial investment
 * @param {number} final - Final value
 * @returns {Object} Calculation results
 */
function calculateROI(initial, final) {
  const profit = final - initial;
  const roiPercent = (profit / initial) * 100;

  return {
    value: roiPercent,
    formatted: formatPercentage(roiPercent),
    profit: formatCurrency(profit),
    isPositive: roiPercent >= 0,
  };
}

/**
 * Calculate Sharpe Ratio
 * @param {number} returns - Portfolio returns
 * @param {number} riskFree - Risk-free rate
 * @param {number} stdDev - Standard deviation
 * @returns {Object} Calculation results
 */
function calculateSharpeRatio(returns, riskFree, stdDev) {
  const sharpe = (returns - riskFree) / stdDev;

  return {
    value: sharpe,
    formatted: formatNumber(sharpe, 3),
    isPositive: sharpe >= 0,
    interpretation: getSharpeInterpretation(sharpe),
  };
}

/**
 * Calculate compound growth
 * @param {number} principal - Initial amount
 * @param {number} rate - Annual rate (as percentage)
 * @param {number} time - Time in years
 * @returns {Object} Calculation results
 */
function calculateCompoundGrowth(principal, rate, time) {
  const finalAmount = principal * Math.pow(1 + (rate / 100), time);
  const totalGain = finalAmount - principal;

  return {
    value: finalAmount,
    formatted: formatCurrency(finalAmount),
    gain: formatCurrency(totalGain),
    isPositive: totalGain >= 0,
  };
}

/**
 * Calculate Value at Risk (VaR)
 * @param {number} value - Portfolio value
 * @param {number} confidence - Confidence level (e.g., 95)
 * @param {number} volatility - Volatility (standard deviation)
 * @returns {Object} Calculation results
 */
function calculateVaR(value, confidence, volatility) {
  // Z-scores for common confidence levels
  const zScores = {
    90: 1.28,
    95: 1.645,
    99: 2.33,
  };

  const zScore = zScores[confidence] || 1.645;
  const var95 = value * volatility * zScore;

  return {
    value: var95,
    formatted: formatCurrency(var95),
    percentage: formatPercentage((var95 / value) * 100),
    isPositive: false, // VaR is always shown as a potential loss
  };
}

/**
 * Display calculator result with color coding
 * @param {HTMLElement} calculator - The calculator widget element
 * @param {Object} result - The calculation result
 */
function displayCalculatorResult(calculator, result) {
  if (!result) return;

  const resultContainer = calculator.querySelector('.calculator-result');
  const resultValue = calculator.querySelector('.calculator-result-value');

  if (!resultValue) return;

  // Update value
  resultValue.textContent = result.formatted || formatNumber(result.value);

  // Color coding
  if (result.isPositive !== undefined) {
    resultValue.style.color = result.isPositive ? '#10b981' : '#ef4444';
  }

  // Add additional info if present
  const additionalInfo = calculator.querySelector('.calculator-additional-info');
  if (additionalInfo && result.interpretation) {
    additionalInfo.textContent = result.interpretation;
  }

  // Animation
  if (resultContainer) {
    resultContainer.classList.add('updated');
    setTimeout(() => resultContainer.classList.remove('updated'), 500);
  }
}

/**
 * Get interpretation for Sharpe Ratio
 * @param {number} sharpe - Sharpe ratio value
 * @returns {string} Interpretation text
 */
function getSharpeInterpretation(sharpe) {
  if (sharpe < 0) return 'Poor - Returns below risk-free rate';
  if (sharpe < 1) return 'Acceptable - Moderate risk-adjusted returns';
  if (sharpe < 2) return 'Good - Strong risk-adjusted returns';
  if (sharpe < 3) return 'Very Good - Excellent risk-adjusted returns';
  return 'Exceptional - Outstanding risk-adjusted returns';
}

// ============================================
// 4. UTILITY FUNCTIONS
// ============================================

/**
 * Format number with specified decimal places
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number
 */
function formatNumber(num, decimals = 2) {
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format number as percentage
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage
 */
function formatPercentage(num, decimals = 2) {
  if (isNaN(num)) return '0.00%';
  return formatNumber(num, decimals) + '%';
}

/**
 * Format number as currency
 * @param {number} num - Number to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency
 */
function formatCurrency(num, currency = 'USD') {
  if (isNaN(num)) return '$0.00';
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
  });
}

/**
 * Validate numeric input
 * @param {string} value - Input value
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateNumericInput(value, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    allowNegative = true,
    allowDecimal = true,
  } = options;

  const num = parseFloat(value);

  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }

  if (!allowNegative && num < 0) {
    return { valid: false, error: 'Negative values are not allowed' };
  }

  if (!allowDecimal && !Number.isInteger(num)) {
    return { valid: false, error: 'Please enter a whole number' };
  }

  if (num < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }

  if (num > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }

  return { valid: true, value: num };
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Smooth scroll to element
 * @param {string} elementId - ID of element to scroll to
 * @param {number} offset - Offset from top (default: 0)
 */
function smoothScrollTo(elementId, offset = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth',
  });
}

/**
 * Add custom calculator function
 * This allows modules to define their own calculator logic
 * @param {string} name - Function name
 * @param {Function} func - Calculator function
 */
function registerCalculator(name, func) {
  window[name] = func;
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b',
  };

  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    font-weight: 500;
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize all interactive features when DOM is ready
 */
function initializeApp() {
  console.log('🚀 Initializing Quantitative Trading Modules...');

  // Initialize all features
  initializeCopyButtons();
  initializeQuizzes();
  initializeCalculators();

  // Add copy button styles dynamically
  injectCopyButtonStyles();

  console.log('✅ All features initialized successfully!');
}

/**
 * Inject CSS styles for copy buttons
 */
function injectCopyButtonStyles() {
  const styles = `
    .copy-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 0.375rem;
      color: #3b82f6;
      cursor: pointer;
      font-size: 0.875rem;
      font-family: var(--font-body);
      transition: all 0.25s ease;
      margin-left: auto;
    }

    .copy-btn:hover {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.5);
      transform: translateY(-1px);
    }

    .copy-btn svg {
      width: 16px;
      height: 16px;
    }

    .calculator-result.updated {
      animation: pulse 0.5s ease;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// ============================================
// AUTO-INITIALIZATION
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export functions for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Copy functionality
    initializeCopyButtons,
    copyCodeToClipboard,

    // Quiz functionality
    initializeQuizzes,
    handleQuizAnswer,
    handleQuizSubmit,

    // Calculator functionality
    initializeCalculators,
    calculateROI,
    calculateSharpeRatio,
    calculateCompoundGrowth,
    calculateVaR,
    registerCalculator,

    // Utility functions
    formatNumber,
    formatPercentage,
    formatCurrency,
    validateNumericInput,
    debounce,
    smoothScrollTo,
    showToast,
  };
}