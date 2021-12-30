const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const pattern = new RegExp(/(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/, 'g');
    // nie wiem jak to dalej zrobić

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if(fileExt != 'gif' && fileExt != 'jpg' && fileExt != 'png') throw new Error('Wrong input!');
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const clientIp = requestIp.getClientIp(req);
    let voter = await Voter.findOne({ user: clientIp });
    if(!voter){
      voter = new Voter({ user: clientIp, votes: [] });
      await voter.save();
    }

    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      if(voter.votes.inclues(photoToUpdate)){
        res.status(500).json(err);
      } else {
        photoToUpdate.votes++;
        photoToUpdate.save();
        voter.votes.push(photoToUpdate);
        res.send({ message: 'OK' });
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
