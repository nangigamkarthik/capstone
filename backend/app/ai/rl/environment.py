"""
Reinforcement Learning (RL) Classroom Environment

Defines the classroom state as an RL environment where the observation
is the aggregated classroom engagement vector and actions are teaching strategies.
"""
import numpy as np
from typing import Dict, List, Tuple

class ClassroomRLEnvironment:
    """
    Simulates a classroom environment for RL agent training.
    
    State:
    - 6 metrics: [mean_attention, mean_engagement, mean_participation, 
                  pct_distracted, pct_confused, pct_collaborating]
                  
    Actions:
    - 0: None (Continue teaching as-is)
    - 1: slow_down (Explain topic with more detail)
    - 2: ask_question (Inject interactive prompt/quiz)
    - 3: move_teaching_zone (Walk to student desk area)
    - 4: repeat_topic (Re-explain last topic differently)
    - 5: student_collaboration (Initiate 2-minute group discussion)
    """
    
    ACTION_MAP = {
        0: "continue_as_is",
        1: "slow_down",
        2: "ask_question",
        3: "move_teaching_zone",
        4: "repeat_topic",
        5: "group_discussion",
    }

    def __init__(self):
        self.state = np.array([75.0, 70.0, 50.0, 10.0, 5.0, 0.0], dtype=np.float32)
        self.steps = 0
        self.max_steps = 100

    def reset(self) -> np.ndarray:
        """Reset classroom state to typical starting distribution."""
        self.state = np.array([75.0, 70.0, 50.0, 10.0, 5.0, 0.0], dtype=np.float32)
        self.steps = 0
        return self.state

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, Dict]:
        """
        Transition classroom state based on teaching action.
        """
        self.steps += 1
        
        # Simulate state transitions based on action impact
        prev_overall = (self.state[0] + self.state[1] + self.state[2]) / 3
        
        # Apply action effect (with noise)
        noise = np.random.normal(0, 2.0, size=6)
        
        if action == 0:  # continue
            # Passive decline in engagement over time without active interventions
            self.state[0] -= 1.0  # attention drops
            self.state[1] -= 0.5  # engagement drops
        elif action == 1:  # slow_down
            self.state[0] += 3.0  # attention rises
            self.state[4] -= 4.0  # confusion drops
        elif action == 2:  # ask_question
            self.state[2] += 12.0 # participation spikes
            self.state[0] += 5.0  # attention spikes
            self.state[3] -= 2.0  # distraction drops
        elif action == 3:  # move_teaching_zone
            self.state[0] += 6.0  # proximity attention boost
            self.state[3] -= 5.0  # distraction drops (back row proximity)
        elif action == 4:  # repeat_topic
            self.state[4] -= 6.0  # confusion drops significantly
            self.state[1] += 2.0
        elif action == 5:  # group_discussion
            self.state[5] += 35.0 # collaboration spikes
            self.state[2] += 8.0  # participation rises
            self.state[0] -= 2.0  # attention on teacher drops (valid focus shift)

        # Clip values to range [0.0, 100.0]
        self.state = np.clip(self.state + noise, 0.0, 100.0)
        
        # Calculate reward
        curr_overall = (self.state[0] + self.state[1] + self.state[2]) / 3
        # Reward = change in overall engagement - penalty for high distraction/confusion
        reward = (curr_overall - prev_overall) - (0.15 * self.state[3] + 0.1 * self.state[4])
        
        done = self.steps >= self.max_steps
        info = {"action_taken": self.ACTION_MAP.get(action, "unknown")}
        
        return self.state, float(reward), done, info
