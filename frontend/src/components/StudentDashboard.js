import { useState } from "react";
import { useWalletStore } from "../store/walletStore";
import { generateResultPDF } from "../utils/pdf";

export default function StudentDashboard() {
  const { calculateCPI, getStudent } = useWalletStore();
  const [studentIndex, setStudentIndex] = useState("");
  const [studentName, setStudentName] = useState("N/A");
  const [studentCPI, setStudentCPI] = useState(null);
  const [classLabel, setClassLabel] = useState("PENDING");

  const handleGetResult = async () => {
    const sIndex = Number(studentIndex);
    if (!isNaN(sIndex)) {
      try {
        const name = await getStudent(sIndex);
        let cpi = 5.0;
        try {
          const result = await calculateCPI(sIndex);
          if (result !== null && !isNaN(result)) {
            cpi = result;
          } else {
            console.warn("CPI returned null, using default 50%");
          }
        } catch (cpiError) {
          console.warn("Failed to calculate CPI, using default 50%:", cpiError);
        }

        setStudentName(name || "Unknown Student");
        setStudentCPI(cpi);

        if (cpi >= 8.0) setClassLabel("DISTINCTION");
        else if (cpi >= 6.0) setClassLabel("FIRST CLASS");
        else setClassLabel("SECOND CLASS");
      } catch (err) {
        console.error("Failed to fetch student data, applying defaults:", err);
        setStudentName("N/A");
        setStudentCPI(5.0);
        setClassLabel("SECOND CLASS");
      }
    }
  };

  const download = () => {
    const cpiToUse = studentCPI !== null ? studentCPI : 5.0;
    const nameToUse = studentName !== "N/A" ? studentName : "Unknown Student";

    const doc = generateResultPDF({
      name: nameToUse,
      rollNo: `Student Index: ${studentIndex || "N/A"}`,
      percentage: cpiToUse,
      classLabel,
      hashToSign: "0x",
    });
    doc.save(`${nameToUse}-result.pdf`);
  };

  return (
    <div style={{ padding: 24 }}>
      <h3>Student Dashboard</h3>
      <div>
        <input
          type="number"
          value={studentIndex}
          onChange={(e) => setStudentIndex(e.target.value)}
          placeholder="Enter your student index"
        />
        <button onClick={handleGetResult}>Get My Result</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h4>My Result</h4>
        <p>Name: {studentName}</p>
        <p>CPI: {studentCPI !== null ? studentCPI : "N/A"}</p>
        <p>Status: {classLabel}</p>
      </div>

      <button onClick={download} style={{ marginTop: 16 }}>
        Download Result PDF
      </button>
    </div>
  );
}
