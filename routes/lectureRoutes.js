const router = require("express").Router();
const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const fs = require("fs");
const path = require("path");

// Models
const { ComponentModel } = require("../models/Components");
const {ContentCreatorApplication,} = require("../models/ContentCreatorApplication");
const requireLogin = require("../middlewares/requireLogin");
const { SectionModel } = require("../models/Sections");
const { LectureModel } = require("../models/Lecture");


//CREATED BY VIDEOSTREAMING TEAM
//get lecture by id
router.get("/:id", async (req, res) => {
  if (!req.params.id) return res.send("Missing query parameters");

  const lectureId = req.params.id;

  let lecture = await LectureModel.findById(lectureId).catch((err) => {
    throw err;
  });

  if (lecture === null)
    return res.send("No section found with id: " + lectureId);
  return res.send(lecture);
});



/**
 * Create Lecture for section
 *  
 * @param {string} section_id - section id
 * @param {string} title - lecture title
 * @returns {object} course NOT SURE
 * 
 */
router.put("/:section_id", /*requireLogin,*/ async (req, res) => {
  const {title, description} = req.body; //Handles the data in "data" from the request
  const section_id = req.params.section_id; //Handles the data in "params" from the request

  const lecture = new LectureModel ({
    parentSection: section_id,
    title: title,
    description: description,
    dateCreated: Date.now(),
    dateUpdated: Date.now()
  });

  try {
    await lecture.save();
    section = await SectionModel.findById(section_id);
    await section.lectures.push(lecture._id);
    await section.save();
    res.status(201).send(lecture);
  } catch (err) {
    res.status(422).send(err);
  }
});


/**
 * Update the lecture
 * 
 * @param {string} id - lecture id
 * @returns {string} - Just sends a message to confirm that the update is complete
 */
router.patch("/:id", /*requireLogin,*/ async (req, res) => {
  const lecture = req.body;
  const { id } = req.params;

  // Find the lecture object by ID and update it
  const dbLecture = await LectureModel.findByIdAndUpdate(
    id,
    {
      title: lecture.title,
      description: lecture.description,
      dateUpdated: Date.now(),
    },
    function (err, docs) {
      if (err) {
        res.status(422).send(err);
      }
    }
  );
  res.status(200).send(dbLecture);
});


/**
 * Get all lectures from a specific section id
 * @param {string} sid - section id
 * @returns {object} - lectures
 */
router.get("/section/:id", async (req, res) => {
  const id = req.params.id; // destructure params
  const lecture = await LectureModel.find({parentSection: id});

  res.send(lecture);
});
  


/**
 * Delete lecture from id
 * Remove it from the section lectures array
 * 
 * @param {string} id - lecture id
 * @returns {string} - Just sends a message to confirm that the deletion is complete
 */
router.delete("/:id"/*, requireLogin*/, async (req, res) => {
  const { id } = req.params; // destructure params

  // Get the lecture object
  const lecture = await LectureModel.findById(id).catch((err) => res.status(204).send(err));

  // Get the section object
  const section_id = lecture.parentSection;
  const section = await SectionModel.findById(section_id).catch((err) => res.status(422).send(err));
  

  // Remove the lecture from the section lectures array
  let lectureIds = section.lectures;
  const index = lectureIds.indexOf(id);
  if (index > -1) {
    lectureIds.splice(index, 1);
  }
  (
    await SectionModel.findByIdAndUpdate(
      section_id,
      { lectures: lectureIds }
    )
  ).save();

  // Delete the lecture object
  await LectureModel.findByIdAndDelete(id).catch((err) => {
    res.status(422).send(err);
  });

  // Send response
  res.status(200).send("Lecture Deleted");
});


module.exports = router;