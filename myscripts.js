
const pickedYears = [1993]

const getRandomYear = (min, max) => Math.round(Math.random() * (max - min) + min)
const getRandomColor = () => Math.round(Math.random() * (360 - 0))

const randomColor = `hsl(${getRandomColor()} 100% 69%)`
document.documentElement.style.setProperty('--glow-color', randomColor);

function getMovieYear(minYear, maxYear) {
  const nbOfYears = maxYear - minYear + 1
  const resultDisplayWrapper = document.querySelector('.result-display-wrapper')
  const resultDisplay = document.querySelector('.result-display')

  // resultDisplay.textContent = getRandomYear(1970, 2023)
  let tempResult
  while(!tempResult || pickedYears.includes(tempResult)) {
    if (pickedYears.length === nbOfYears) tempResult = minYear - 1
    else tempResult = getRandomYear(minYear, maxYear)
    console.log('tempResult', tempResult)
  }

  console.log('hello')
  resultDisplay.textContent = tempResult

  resultDisplayWrapper.classList.remove('date-shown-a')
  setTimeout(() => {
    resultDisplayWrapper.classList.add('date-shown-a')
  }, 500);
}
