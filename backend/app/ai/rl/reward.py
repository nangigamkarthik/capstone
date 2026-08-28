"""
Reinforcement Learning (RL) Reward Function

Computes numeric reward signals based on positive classroom state transitions
and comfort zone thresholds.
"""
import numpy as np

def compute_reward(
    prev_state: np.ndarray,
    curr_state: np.ndarray,
    action: int,
) -> float:
    """
    Computes reward for transition: prev_state -> curr_state under action.
    
    Observation vector elements:
    0: attention
    1: engagement
    2: participation
    3: distraction
    4: confusion
    5: collaboration
    """
    # 1. Delta in core engagement metrics
    delta_att = curr_state[0] - prev_state[0]
    delta_eng = curr_state[1] - prev_state[1]
    delta_part = curr_state[2] - prev_state[2]
    
    reward = 0.4 * delta_att + 0.4 * delta_eng + 0.2 * delta_part
    
    # 2. Penalize high distraction levels (> 20%)
    if curr_state[3] > 20.0:
        reward -= 0.5 * (curr_state[3] - 20.0)
        
    # 3. Penalize high confusion levels (> 15%)
    if curr_state[4] > 15.0:
        reward -= 0.3 * (curr_state[4] - 15.0)

    # 4. Action cost penalty (prevents agent from cycling massive interventions continuously)
    action_cost = {0: 0.0, 1: 0.5, 2: 1.0, 3: 0.8, 4: 0.7, 5: 1.5}
    reward -= action_cost.get(action, 0.0)
    
    return float(reward)
