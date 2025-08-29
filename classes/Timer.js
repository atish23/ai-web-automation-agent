// Performance Timer Class
class Timer {
  constructor(name) {
    this.name = name;
    this.startTime = performance.now();
  }

  end() {
    return Math.round(performance.now() - this.startTime);
  }
}

export default Timer;
