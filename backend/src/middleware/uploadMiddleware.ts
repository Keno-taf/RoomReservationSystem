import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDirectory = path.join(
  process.cwd(),
  'uploads',
  'facilities'
)

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory)
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(
      file.originalname
    )

    const uniqueName =
      `facility-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`

    cb(null, uniqueName)
  }
})

const fileFilter: multer.Options['fileFilter'] = (
  _req,
  file,
  cb
) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Only JPG, JPEG, PNG, and WEBP images are allowed.'
      )
    )
  }
}

const uploadFacilityImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

export default uploadFacilityImage