import Quiz from "../models/Quiz.js";
import QuizResponse from "../models/QuizResponse.js";
import Course from "../models/Course.js";
// import { PDFDocument, rgb } from "pdf-lib";
import { transporter } from "../utitlitis/sendMail.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";
import PDFDocument from "pdfkit";

export const CreateQuiz = async (req, res) => {
  try {
    const { name, questions } = req.body;
    const quiz = await Quiz.create({ name, questions });
    if (!quiz) res.status(404).json({ message: "Failing Creating The quiz" });
    res.status(200).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failing Creating The quiz", err: error.message });
  }
};

// async function generateCertificate(user) {
//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([600, 400]);

//   page.drawText(`Certificate of Completion`, { x: 200, y: 300, size: 24 });
//   page.drawText(`This is to certify that ${user.firstName} ${user.lastName}`, {
//     x: 100,
//     y: 250,
//     size: 18,
//   });
//   page.drawText(`has successfully completed the course.`, {
//     x: 100,
//     y: 220,
//     size: 18,
//   });

//   const pdfBytes = await pdfDoc.save();

//   const __filename = new URL(import.meta.url).pathname;
//   const __dirname = path.dirname(__filename);

//   const rootDir = path.resolve(__dirname, "..");
//   const dir = path.join(rootDir, "certificates");

//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//     console.log("Certificates directory created:", dir);
//   }

//   const pdfFileName = `${user._id}-certificate.pdf`;
//   fs.writeFileSync(path.join(dir, pdfFileName), pdfBytes);

//   return { pdfBytes, pathPdf: path.join(dir, pdfFileName) };
// }

export const generateCertificate = async (user, courseTitle) => {
  // Create the PDF document
  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
  });

  // Generate the file path for saving
  const date = new Date();
  const pdfFileName = `${user._id}_${date.getTime()}.pdf`;

  // Define the root directory and certificates folder in the root
  const rootDir = path.resolve();
  const dir = path.join(rootDir, "certificates");

  // Ensure the certificates directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("Certificates directory created:", dir);
  }

  const filePath = path.join(dir, pdfFileName);

  // Pipe the PDF to the file in the root certificates folder
  doc.pipe(fs.createWriteStream(filePath));

  // Add background image and text
  doc.image(path.join(rootDir, "certifivateTemplate", "CanvaGen.png"), 0, 0, {
    width: 842,
  });
  doc
    .font(
      path.join(rootDir, "fonts", "OpenSans-VariableFont_wdth,wght.ttf"),
      400
    )
    .fontSize(50)
    .text(courseTitle, 50, 250, { align: "center" });

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  doc
    .fontSize(20)
    .text(`${user.firstName} ${user.lastName}`, -245, 315, { align: "center" });
  doc.fontSize(20).text(formattedDate, 400, 315, { align: "center" });

  doc
    .font(path.join(rootDir, "fonts", "Creattion Demo.otf"), 6)
    .fontSize(50)
    .text("BSESA", 50, 360, { align: "center" });

  const pdfChunks = [];
  const stream = doc.pipe(new PassThrough());

  stream.on("data", (chunk) => pdfChunks.push(chunk));
  doc.end();

  await new Promise((resolve) => stream.on("end", resolve));

  const pdfBytes = Buffer.concat(pdfChunks);

  return { pdfBytes, pathPdf: filePath };
};

export const saveQuizResponse = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { courseId, responses } = req.body;
    const userId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let correctAnswers = 0;

    responses.forEach((response) => {
      const question = quiz.questions.find(
        (q) => q._id.toString() === response.questionId
      );
      const correctOption = question.options.find((opt) => opt.isCorrect);

      if (correctOption && correctOption.text === response.selectedOption) {
        correctAnswers++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const score = (correctAnswers / totalQuestions) * 100;
    const passed = score >= 70; // Example passing score

    const existingResponse = await QuizResponse.findOne({ quizId, userId });
    if (existingResponse) {
      if (!existingResponse.passed) {
        await QuizResponse.deleteOne({ _id: existingResponse._id });
      }
    }
    let certificate = null;
    if (passed) {
      const user = await User.findById(userId);
      const course = await Course.findById(courseId);
      const { pathPdf, pdfBytes } = await generateCertificate(
        user,
        course.title
      );
      certificate = pathPdf;
      await transporter.sendMail({
        from: `Elearning <${process.env.SMTP_MAIL}>`,
        to: user.email,
        subject: "Your Course Completion Certificate",
        text: `Dear ${user.firstName},\n\nCongratulations on completing the course!`,
        attachments: [
          {
            filename: `${user.firstName}-certificate.pdf`,
            content: pdfBytes,
          },
        ],
      });
    }

    const quizResponse = new QuizResponse({
      courseId,
      quizId,
      userId,
      responses,
      score,
      passed,
      certificate,
    });

    await quizResponse.save();

    if (quizResponse.passed) {
      return res.status(200).json({
        score,
        passed,
        message: "Please Chech Your Email, We Will Send You Do Certificate",
      });
    }
    return res.status(200).json({
      score,
      passed,
      message: "You Fail , Please Try Again Tomorrow",
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", err: error.message });
  }
};

export const CheckLastTimeQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { courseId } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const checkPassed = await QuizResponse.findOne({
      quizId,
      courseId,
      userId,
    })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .lean(); // Use lean for better performance

    if (checkPassed && checkPassed.passed)
      return res
        .status(401)
        .json({ message: "You have passed the Quiz Already You Can't Repeat" });

    if (checkPassed) {
      const oneDayLater = new Date(checkPassed.createdAt);
      oneDayLater.setDate(oneDayLater.getDate() + 1);
      if (now < oneDayLater) {
        const timeLeft = oneDayLater - now;
        const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
        return res.status(403).json({
          message: `You must wait ${hoursLeft} hour(s) before retaking this quiz.`,
        });
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Error Server", err: error.message });
  }
};

export const addQuizToCourse = async (req, res) => {
  try {
    const { quizId, courseId } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: { quiz: quizId } },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      message: "Quiz added to Course successfully",
      course: updatedCourse,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Quiz failed to add", error: error.message });
  }
};

export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.quizId).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    quiz.questions.forEach((q) => {
      q.options = q.options.map(({ text }) => ({ text }));
    });

    res.status(200).json({ quiz });
  } catch (error) {
    res.status(500).json({ message: "Server Error", err: error.message });
  }
};
