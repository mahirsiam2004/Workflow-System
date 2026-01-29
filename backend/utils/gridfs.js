const { GridFSBucket, ObjectId } = require('mongodb');
const multer = require('multer');
const { Readable } = require('stream');

let bucket;

function initGridFS(db) {
    bucket = new GridFSBucket(db, {
        bucketName: 'uploads'
    });
    return bucket;
}

function getGridFSBucket() {
    if (!bucket) {
        throw new Error('GridFS not initialized');
    }
    return bucket;
}

// Multer memory storage for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only accept ZIP files
        if (file.mimetype === 'application/zip' ||
            file.mimetype === 'application/x-zip-compressed' ||
            file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only ZIP files are allowed'));
        }
    }
});

async function uploadFile(fileBuffer, filename, metadata = {}) {
    const bucket = getGridFSBucket();

    return new Promise((resolve, reject) => {
        const readableStream = Readable.from(fileBuffer);
        const uploadStream = bucket.openUploadStream(filename, {
            metadata
        });

        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
            resolve(uploadStream.id);
        });

        readableStream.pipe(uploadStream);
    });
}

async function downloadFile(fileId) {
    const bucket = getGridFSBucket();

    return new Promise((resolve, reject) => {
        const chunks = [];
        const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

        downloadStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        downloadStream.on('error', reject);

        downloadStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
    });
}

async function getFileInfo(fileId) {
    const bucket = getGridFSBucket();
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    return files[0] || null;
}

async function deleteFile(fileId) {
    const bucket = getGridFSBucket();
    await bucket.delete(new ObjectId(fileId));
}

function createDownloadStream(fileId) {
    const bucket = getGridFSBucket();
    return bucket.openDownloadStream(new ObjectId(fileId));
}

module.exports = {
    initGridFS,
    getGridFSBucket,
    upload,
    uploadFile,
    downloadFile,
    getFileInfo,
    deleteFile,
    createDownloadStream
};
