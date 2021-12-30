const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...
      
      const textPattern = new RegExp(/(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/, 'g'); // zostawiam tak to avoid troubles

      const titleMatched = title.match(textPattern).join('');
      if(titleMatched.length < title.length) throw new Error('Invalid characters...');

      const authorMatched = author.match(textPattern).join('');
      if(authorMatched.length < author.length) throw new Error('Invalid characters...');

      // kradzione z githuba, bo jestem zlym czlowiekiem wypelnionym zbyt duza iloscia carbsow
      const emailPattern = new RegExp(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.([a-z]{1,6}))$/i);
      const emailMatched = email.match(emailPattern).join('');
      if(emailMatched.length < email.length) throw new Error('Invalid characters...');

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
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const clientIp = requestIp.getClientIp(req);
      let voter = await Voter.findOne({ user: clientIp });
      if(!voter){
        voter = new Voter({ user: clientIp, votes: [photoToUpdate] });
        await voter.save();
      } else {
        if(voter.votes.includes(photoToUpdate)){
          throw new Error('You\'ve already voted for this picture!');
        } else {
          voter.votes.push(photoToUpdate);
          await voter.save();
        }
      }
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }
};