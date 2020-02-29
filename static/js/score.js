
var Score;

function setScore()
{
  Score = 0;
}

function updateScore(mouseXPos, sliderValue)
{
  float diff = Math.abs(mouseXPos - sliderValue);

  if (diff > 10)
  {
    Score -= 2
  }
  else
  {
    Score += 1
  }
  document.getElementById("header").innerHTML = `Score ${Score}`

}
