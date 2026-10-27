const musicModel = require('../models/music.model')
const albumModel = require("../models/album.model")
const { uploadFile} = require('../services/storage.service')
const jwt = require('jsonwebtoken')





async function createMusic  (req,res) {

    const{title} = req.body;
    const file = req.file


    const result = await uploadFile(file.buffer.toString('base64'))

    const musics = await musicModel.create({
        uri:result.url,
        title,
        artist:req.user.id
})

    res.status(201).json({
        message:'music created successfully',
        musics:{
            id:musics._id,
            uri:musics.uri,
            title:musics.title,
            artist:musics.artist
        }
    })
     
}



async function createAlbum(req,res){


        const {title ,musics} = req.body;

        const album = await albumModel.create({
            title,
            artist : req.user.id,
            musics
        })

        res.status(201).json({
            message:"album created successfully",
            album
        })

   
}


async function getAllMusics(req,res) {
    const musics = await musicModel
    .find()
    .populate("artist","username email")

    res.status(200).json({
        message:"musics fetched successfully",  
        musics:musics,
     })
}

async function getAllAlbums(req,res){

    const albums = await albumModel.find().select("title artist").populate("artist","username email").populate("musics")

    res.status(200).json({
        message:"Album fetched successfully",
        albums
    })
}


module.exports= { createMusic,createAlbum , getAllMusics, getAllAlbums}