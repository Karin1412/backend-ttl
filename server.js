import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Default Love Day
const LOVE_DAY = new Date("2025-02-11");

// Schemas
const EventSchema = new mongoose.Schema({
  title: String,
  date: Date,
  description: String,
});
const NotificationSchema = new mongoose.Schema({
  message: String,
  eventDate: Date,
});
const MemorySchema = new mongoose.Schema({
  content: String,
  date: { type: Date, default: Date.now },
});
const AlbumSchema = new mongoose.Schema({
  name: String,
  photos: [String],
});

const Event = mongoose.model("Event", EventSchema);
const Notification = mongoose.model("Notification", NotificationSchema);
const Memory = mongoose.model("Memory", MemorySchema);
const Album = mongoose.model("Album", AlbumSchema);

// Routes
app.get("/love-day", (req, res) => {
  res.json({ loveDay: LOVE_DAY });
});

app.get("/memories/recent", async (req, res) => {
  const memories = await Memory.find().sort({ date: -1 }).limit(2);
  res.json(memories);
});

app.post("/events", async (req, res) => {
  const newEvent = new Event(req.body);
  await newEvent.save();
  res.json(newEvent);
});

app.get("/events", async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

app.post("/notifications", async (req, res) => {
  const newNotification = new Notification(req.body);
  await newNotification.save();
  res.json(newNotification);
});

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

app.post("/albums", async (req, res) => {
  const newAlbum = new Album({ name: req.body.name, photos: [] });
  await newAlbum.save();
  res.json(newAlbum);
});

app.post("/albums/:id/photos", upload.single("photo"), async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) return res.status(404).json({ error: "Album not found" });
  album.photos.push(`/uploads/${req.file.filename}`);
  await album.save();
  res.json(album);
});

app.post("/memories", async (req, res) => {
  const newMemory = new Memory(req.body);
  await newMemory.save();
  res.json(newMemory);
});

app.get("/love-day/count", (req, res) => {
  const today = new Date();
  const loveStartDate = new Date(LOVE_DAY);

  const diffTime = today - loveStartDate;
  const daysCount = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  res.json({ daysTogether: daysCount });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
