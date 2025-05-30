import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import env from "dotenv";
env.config();

const allowedOrigins = [
    'http://localhost:5173', 
];

const app = express();
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// }));
app.use(cors());
app.use(express.json());

app.post("/api/run", async (req, res) => {
  try {
    // console.log(req.body);
    const response = await fetch(process.env.LINK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to execute code", details: err.message });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "API is running!" });
});

// app.post("/api/verify", async (req, res) => {
//   try {
//     const { properties, testCases } = req.body;
//     const results = [];

//     // Process each test case sequentially
//     for (const testCase of testCases) {
//       try {
//         // Create the request body for each test case
//         const requestBody = {
//         };
//         requestBody.properties = {
//           ...properties,
//           stdin: testCase.input
//         }

//         const response = await fetch(process.env.LINK, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(requestBody),
//         });

//         const data = await response.json();
//         const actualOutput = data?.exception || data?.stdout || "No output";
//         const executionTime = data?.executionTime || "NA";
        
//         // Check if test case passed
//         const passed = actualOutput.trim() === testCase.expectedOutput.trim();
        
//         results.push({
//           id: testCase.id,
//           input: testCase.input,
//           expectedOutput: testCase.expectedOutput,
//           actualOutput,
//           passed,
//           executionTime,
//           inputFileName: testCase.inputFileName,
//           outputFileName: testCase.outputFileName,
//           error: false
//         });

//       } catch (error) {
//         results.push({
//           id: testCase.id,
//           input: testCase.input,
//           expectedOutput: testCase.expectedOutput,
//           actualOutput: `Error: ${error.message}`,
//           passed: false,
//           error: true,
//           inputFileName: testCase.inputFileName,
//           outputFileName: testCase.outputFileName
//         });
//       }
//     }

//     res.status(200).json({ results });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to verify code", details: err.message });
//   }
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});