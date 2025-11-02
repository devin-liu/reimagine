const { useState, useEffect, useRef } = React;
const { ChevronRight, X, RefreshCw, Timer, Award, Clock, TrendingUp, CheckCircle, Lightbulb } = lucideReact;

const storageKey = 'i-can-app-data';

const PainToleranceApp = () => {
  const [taskIntention, setTaskIntention] = useState('');
  const [taskDuration, setTaskDuration] = useState(25); // Default 25 minutes Pomodoro
  const [painReasons, setPainReasons] = useState([
    { id: 'rejection', label: 'Rejection', selected: false },
    { id: 'judgement', label: 'Judgement', selected: false },
    { id: 'not-priority', label: 'Not Priority', selected: false },
    { id: 'boring', label: 'Boring', selected: false },
    { id: 'get-stuck', label: 'Get Stuck', selected: false }
  ]);

  const [currentStage, setCurrentStage] = useState('intention-setting');
  const [currentPainRating, setCurrentPainRating] = useState(0);
  const [expectedRestartPain, setExpectedRestartPain] = useState(0);
  const [countdown, setCountdown] = useState(0);

  // Enhanced progress tracking
  const [progressLog, setProgressLog] = useState([]);
  const [successInsights, setSuccessInsights] = useState([]);
  const [actuallyCanStatements, setActuallyCanStatements] = useState([]);
  const startTimeRef = useRef(null);
  const [toleratedTime, setToleratedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  // Timer for task duration
  const [isTaskTimerActive, setIsTaskTimerActive] = useState(false);

  // Current task completion details for reflection
  const [currentCompletion, setCurrentCompletion] = useState(null);
  const [currentReflection, setCurrentReflection] = useState('');

  // Load previous data on mount
  useEffect(() => {
    const loadedData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (loadedData.progressLog) {
      setProgressLog(loadedData.progressLog);
    }
    if (loadedData.successInsights) {
      setSuccessInsights(loadedData.successInsights);
    }
    if (loadedData.actuallyCanStatements) {
      setActuallyCanStatements(loadedData.actuallyCanStatements);
    }
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({
      progressLog,
      successInsights,
      actuallyCanStatements
    }));
  }, [progressLog, successInsights, actuallyCanStatements]);

  // Task duration timer
  useEffect(() => {
    let timer;
    if (isTaskTimerActive && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Task time completed
            handleTaskCompletion('time-limit');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTaskTimerActive, remainingTime]);

  // Countdown timer and time tracking
  useEffect(() => {
    let timer;
    if (currentStage === 'working') {
      startTimeRef.current = Date.now();
    }

    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && currentStage === 'countdown') {
      setCurrentStage('working');
    }
    return () => clearInterval(timer);
  }, [countdown, currentStage]);

  const startTask = () => {
    // Set up task timer
    setRemainingTime(taskDuration * 60); // Convert minutes to seconds
    setIsTaskTimerActive(true);

    setCurrentStage('working');
  };

  const handleTaskCompletion = (completionType = 'manual') => {
    // Calculate tolerated time
    const endTime = Date.now();
    const toleratedMinutes = startTimeRef.current
      ? Math.round((endTime - startTimeRef.current) / 60000)
      : 0;
    setToleratedTime(toleratedMinutes);

    // Stop the task timer
    setIsTaskTimerActive(false);

    const selectedReasons = painReasons
      .filter(reason => reason.selected)
      .map(reason => reason.label);

    const feedbackEntry = {
      taskIntention,
      completionType,
      date: new Date().toISOString(),
      painReasons: selectedReasons,
      currentPainRating,
      expectedRestartPain,
      toleratedTime: toleratedMinutes,
      plannedDuration: taskDuration,
      actualDuration: toleratedMinutes
    };

    // Set current completion for reflection
    setCurrentCompletion(feedbackEntry);
    setCurrentStage('reflection');
  };

  const submitReflection = () => {
    if (currentReflection.trim()) {
      // Add "Actually, I can..." statement
      const actuallyCanStatement = `Actually, I can ${currentReflection.trim()}`;
      setActuallyCanStatements(prev => [actuallyCanStatement, ...prev]);

      // Reset for next task
      setCurrentStage('intention-setting');
      setTaskIntention('');
      setCurrentPainRating(0);
      setExpectedRestartPain(0);
      setPainReasons(prev => prev.map(reason => ({...reason, selected: false})));
      setCurrentReflection('');
      setCurrentCompletion(null);
    }
  };

  const renderStage = () => {
    switch(currentStage) {
      case 'intention-setting':
        return (
          <div className="p-6 bg-gray-100 min-h-screen flex flex-col justify-center">
            <h1 className="text-2xl font-bold mb-4">Prepare Your Task</h1>
            <input
              type="text"
              value={taskIntention}
              onChange={(e) => setTaskIntention(e.target.value)}
              placeholder="What task are you going to do?"
              className="w-full p-2 border rounded mb-4"
            />
            <div>
              <h2 className="font-semibold mb-2">Potential Pain Points</h2>
              {painReasons.map((reason) => (
                <div key={reason.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={reason.id}
                    checked={reason.selected}
                    onChange={() => {
                      setPainReasons(prev =>
                        prev.map(r =>
                          r.id === reason.id
                            ? {...r, selected: !r.selected}
                            : r
                        )
                      );
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={reason.id}>{reason.label}</label>
                </div>
              ))}
            </div>
            <button
              onClick={startTask}
              className="mt-4 bg-blue-500 text-white p-2 rounded flex items-center justify-center"
              disabled={!taskIntention.trim()}
            >
              Start Task <ChevronRight className="ml-2" />
            </button>
          </div>
        );

      case 'working':
        return (
          <div className="p-6 bg-green-50 min-h-screen flex flex-col justify-center items-center">
            <h1 className="text-2xl font-bold mb-4">Working on: {taskIntention}</h1>
            <p>Stay focused. You're building tolerance!</p>
            <button
              onClick={() => {
                setCurrentPainRating(0);
                setCurrentStage('pain-feedback');
              }}
              className="mt-4 bg-red-500 text-white p-2 rounded"
            >
              Simulate Tabbing Out
            </button>
          </div>
        );

      case 'reflection':
        return (
          <div className="p-6 bg-blue-50 min-h-screen flex flex-col justify-center">
            <h1 className="text-2xl font-bold mb-4 flex items-center">
              <Lightbulb className="mr-2 text-yellow-500" /> Task Reflection
            </h1>

            <div className="bg-white p-4 rounded shadow mb-4">
              <h2 className="font-semibold">Task Details</h2>
              <p><strong>Task:</strong> {currentCompletion?.taskIntention}</p>
              <p><strong>Time Spent:</strong> {currentCompletion?.toleratedTime} minutes</p>

              <h3 className="font-semibold mt-2">Pain Points</h3>
              <ul className="list-disc list-inside">
                {currentCompletion?.painReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>

              <p className="mt-2">
                <strong>Pain Rating:</strong> {currentCompletion?.currentPainRating}/10
              </p>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Actually, I can...</label>
              <textarea
                value={currentReflection}
                onChange={(e) => setCurrentReflection(e.target.value)}
                placeholder="Write down what you've learned or accomplished"
                className="w-full p-2 border rounded h-24"
              />
            </div>

            <button
              onClick={submitReflection}
              className="bg-blue-500 text-white p-2 rounded flex items-center justify-center"
              disabled={!currentReflection.trim()}
            >
              Complete Reflection <Award className="ml-2" />
            </button>
          </div>
        );

      case 'pain-feedback':
        return (
          <div className="p-6 bg-red-50 min-h-screen flex flex-col justify-center">
            <h1 className="text-2xl font-bold mb-4">Pain Acknowledgment</h1>

            <div className="mb-4">
              <h2 className="font-semibold mb-2">Why Did You Leave?</h2>
              {painReasons.map((reason) => (
                <div key={reason.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={reason.id}
                    checked={reason.selected}
                    onChange={() => {
                      setPainReasons(prev =>
                        prev.map(r =>
                          r.id === reason.id
                            ? {...r, selected: !r.selected}
                            : r
                        )
                      );
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={reason.id}>{reason.label}</label>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block mb-2">Current Pain Rating (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={currentPainRating}
                onChange={(e) => setCurrentPainRating(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center">{currentPainRating}</div>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Expected Restart Pain (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={expectedRestartPain}
                onChange={(e) => setExpectedRestartPain(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center">{expectedRestartPain}</div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setCurrentStage('working');
                }}
                className="flex-1 bg-green-500 text-white p-2 rounded flex items-center justify-center"
              >
                <RefreshCw className="mr-2" /> Restart Task
              </button>
              <button
                onClick={() => handleTaskCompletion('interrupted')}
                className="flex-1 bg-blue-500 text-white p-2 rounded flex items-center justify-center"
              >
                <CheckCircle className="mr-2" /> Complete Task
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderProgressLog = () => {
    return (
      <div className="p-6 bg-gray-50">
        <h2 className="text-xl font-bold mt-6 mb-4 flex items-center">
          <Lightbulb className="mr-2 text-blue-500" /> "Actually, I Can" Statements
        </h2>
        {actuallyCanStatements.length === 0 ? (
          <p>Complete tasks to build your "Actually, I Can" collection!</p>
        ) : (
          <div className="space-y-2">
            {actuallyCanStatements.slice(0, 5).map((statement, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded shadow flex items-center"
              >
                <CheckCircle className="mr-3 text-green-500" />
                <p>{statement}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto">
        {renderStage()}
        {renderProgressLog()}
      </div>
    </div>
  );
};

// Mount the React app
const root = ReactDOM.createRoot(document.getElementById('react-root'));
root.render(<PainToleranceApp />);
