"""
Reinforcement Learning (RL) Policy Agent — Q-Learning & PPO Recommender

Trains a policy mapping current classroom state vectors to recommended teaching actions.
Provides real-time optimal strategy recommendations for the Teacher AI Copilot.
"""
import numpy as np
from typing import Dict, List, Tuple
from loguru import logger
from app.ai.rl.environment import ClassroomRLEnvironment

class TeachingRLAgent:
    """
    Q-Learning agent acting as a recommendation recommender.
    
    Q-table size: State space is discretized.
    Inputs: classroom state vector (6 elements)
    Outputs: Recommended teaching action index (0 to 5)
    """

    def __init__(
        self,
        learning_rate: float = 0.1,
        discount_factor: float = 0.9,
        epsilon: float = 0.15,
    ):
        self.lr = learning_rate
        self.gamma = discount_factor
        self.epsilon = epsilon
        
        # Simple Q-table simulated representation
        # Maps discretized state tuple (3 intervals per metric -> 3^6 = 729 states) to 6 action values
        self.q_table: Dict[Tuple, np.ndarray] = {}
        self.rng = np.random.RandomState(202)

    def _discretize_state(self, state: np.ndarray) -> Tuple[int, ...]:
        """Discretize state space elements into low (0), medium (1), high (2) buckets."""
        discretized = []
        for i, val in enumerate(state):
            if i in [3, 4]:  # Distraction, confusion (lower is better, different thresholds)
                if val < 10.0: discretized.append(0)
                elif val < 25.0: discretized.append(1)
                else: discretized.append(2)
            else:  # Attention, engagement, participation, collaboration
                if val < 40.0: discretized.append(0)
                elif val < 75.0: discretized.append(1)
                else: discretized.append(2)
        return tuple(discretized)

    def select_action(self, state: np.ndarray, train: bool = True) -> int:
        """Select action using epsilon-greedy policy."""
        state_key = self._discretize_state(state)
        
        # Initialize state action values if unseen
        if state_key not in self.q_table:
            self.q_table[state_key] = self.rng.normal(0, 0.1, size=6)
            
        if train and self.rng.uniform(0.0, 1.0) < self.epsilon:
            # Explore: pick random teaching intervention
            return int(self.rng.randint(0, 6))
        else:
            # Exploit: pick action with highest expected Q-value
            return int(np.argmax(self.q_table[state_key]))

    def learn(self, state: np.ndarray, action: int, reward: float, next_state: np.ndarray):
        """Update Q-values using temporal difference learning equation."""
        state_key = self._discretize_state(state)
        next_key = self._discretize_state(next_state)
        
        if state_key not in self.q_table:
            self.q_table[state_key] = np.zeros(6)
        if next_key not in self.q_table:
            self.q_table[next_key] = np.zeros(6)
            
        old_val = self.q_table[state_key][action]
        next_max = np.max(self.q_table[next_key])
        
        # Bellman update
        self.q_table[state_key][action] = old_val + self.lr * (reward + self.gamma * next_max - old_val)

    def train_agent(self, env: ClassroomRLEnvironment, episodes: int = 500) -> List[float]:
        """Train agent against simulated classroom environment, returns reward curve."""
        logger.info(f"Training Teaching RL agent for {episodes} episodes...")
        reward_history = []
        
        for ep in range(episodes):
            state = env.reset()
            done = False
            total_reward = 0.0
            
            while not done:
                action = self.select_action(state, train=True)
                next_state, reward, done, _ = env.step(action)
                self.learn(state, action, reward, next_state)
                state = next_state
                total_reward += reward
                
            reward_history.append(total_reward)
            
        logger.info(f"RL training complete. Avg episode reward: {np.mean(reward_history[-50:]):.2f}")
        return reward_history

    def get_recommendation(self, classroom_metrics: Dict[str, float]) -> Dict:
        """
        Produce a real-time recommendation string and confidence based on state.
        """
        state = np.array([
            classroom_metrics.get("attention", 70.0),
            classroom_metrics.get("engagement", 70.0),
            classroom_metrics.get("participation", 50.0),
            classroom_metrics.get("distraction", 10.0),
            classroom_metrics.get("confusion", 5.0),
            classroom_metrics.get("collaboration", 0.0)
        ], dtype=np.float32)
        
        action_idx = self.select_action(state, train=False)
        action_name = ClassroomRLEnvironment.ACTION_MAP.get(action_idx, "continue_as_is")
        
        # Recommendations mapped to actions
        rec_details = {
            "continue_as_is": {
                "text": "Continue teaching with current delivery mode.",
                "reasoning": "Classroom engagement and attention levels are currently within optimal comfort zones.",
                "priority": "low"
            },
            "slow_down": {
                "text": "Slow down the lecture delivery speed.",
                "reasoning": "Confusion index spikes indicate students are struggling to keep up with the explanation pace.",
                "priority": "high"
            },
            "ask_question": {
                "text": "Inject an interactive question or brief formative quiz.",
                "reasoning": "Visual attention focus is declining; interactive questioning will re-engage student focus.",
                "priority": "medium"
            },
            "move_teaching_zone": {
                "text": "Move your physical teaching position toward the back of the classroom.",
                "reasoning": "Distraction levels in the rear seating rows have spiked; proximity will restore task focus.",
                "priority": "medium"
            },
            "repeat_topic": {
                "text": "Re-explain the current concept using a different analogy or visual aid.",
                "reasoning": "High confusion index suggests the current conceptual model is not resonating.",
                "priority": "high"
            },
            "group_discussion": {
                "text": "Initiate a 2-minute student peer discussion ('think-pair-share').",
                "reasoning": "Passive lecture fatigue detected; peer collaboration will reset cognitive load.",
                "priority": "medium"
            }
        }
        
        rec = rec_details.get(action_name)
        return {
            "action": action_name,
            "recommendation": rec["text"],
            "reasoning": rec["reasoning"],
            "priority": rec["priority"],
        }
