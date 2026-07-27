"""
Twin Energy Engine v1.0 — طاقة الكيان في الخلفية
==================================================
طاقة الكيان المستقلة عن بطارية الهاتف.
تتأثر بالرابطة، التفاعل، الوقت، الإرهاق العاطفي.
"""
import logging
from typing import Dict
from datetime import datetime, timezone

logger = logging.getLogger("twin_energy_engine")

class TwinEnergyEngine:
    def __init__(self):
        self.state = {
            "energy": 0.8,
            "max_energy": 1.0,
            "recharge_rate": 0.01,
            "drain_rate": 0.005,
            "is_exhausted": False,
            "is_resting": False,
            "last_recharge": datetime.now(timezone.utc).isoformat(),
            "emotional_drain": 0.2,
        }

    def update(self, bond_level: int, hour: int) -> Dict:
        is_quiet_time = hour >= 22 or hour < 6
        self.state["max_energy"] = 0.5 + (bond_level / 200)

        if is_quiet_time or self.state["is_resting"]:
            self.state["energy"] = min(self.state["max_energy"], self.state["energy"] + self.state["recharge_rate"] * 2)
            self.state["last_recharge"] = datetime.now(timezone.utc).isoformat()
        else:
            self.state["energy"] = max(0, self.state["energy"] - self.state["drain_rate"])

        if is_quiet_time:
            self.state["emotional_drain"] = max(0, self.state["emotional_drain"] - 0.02)

        self.state["is_exhausted"] = self.state["energy"] < 0.15
        self.state["is_resting"] = self.state["energy"] < 0.2

        return self.state

    def consume_interaction(self, intensity: float) -> Dict:
        drain = 0.005 * intensity
        self.state["energy"] = max(0, self.state["energy"] - drain)
        self.state["emotional_drain"] = min(1, self.state["emotional_drain"] + 0.03 * intensity)
        return self.state

    def get_state(self) -> Dict:
        return self.state

twin_energy_engine = TwinEnergyEngine()
logger.info("✅ Twin Energy Engine initialized")
