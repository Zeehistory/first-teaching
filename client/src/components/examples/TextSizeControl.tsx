import { useState } from "react";
import TextSizeControl from "../TextSizeControl";

export default function TextSizeControlExample() {
  const [textSize, setTextSize] = useState(18);

  return (
    <div className="flex items-center justify-center p-8">
      <TextSizeControl
        textSize={textSize}
        onIncrease={() => setTextSize((s) => Math.min(s + 2, 22))}
        onDecrease={() => setTextSize((s) => Math.max(s - 2, 14))}
      />
    </div>
  );
}
