import { useEffect, useState } from "react";
import { engine, EngineState } from "@/lib/audioEngine";

export function useAudioEngine(): EngineState {
  const [state, setState] = useState<EngineState>(engine.getState());

  useEffect(() => {
    const unsub = engine.subscribe(setState);
    return unsub;
  }, []);

  return state;
}
