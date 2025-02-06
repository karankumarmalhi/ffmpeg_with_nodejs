    import express from 'express';
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';
    import path from 'path';
    import multer from 'multer';
    import fs from 'fs';
    import { exec } from 'child_process'

    const app = express();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);


    const uploadsDir = path.join(__dirname, "public", "upload");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    app.use(express.static(uploadsDir));

  
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
            cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
        },
    });

    // Video filter
    const videoFilter = (req, file, callback) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (
            ext !== '.mp4' &&
            ext !== '.avi' &&
            ext !== '.flv' &&
            ext !== '.wmv' &&
            ext !== '.mov' &&
            ext !== '.mkv' &&
            ext !== '.gif' &&
            ext !== '.m4v'
        ) {
            return callback(new Error("This file extension is not supported"), false);
        }
        callback(null, true);
    };
    const fontPath ='Poppins-Bold.ttf'


    const maxSize = 100 * 1024 * 1024; // 100 MB
    app.use(express.json())


    const upload = multer({
        storage: storage,
        fileFilter: videoFilter,
        limits: { fileSize: maxSize },
    }).single('file');


    app.post('/uploadfile', (req, res) => {
        upload(req, res, (err) => {
            if (err) {
                console.log(err);
                return res.status(400).send({ message: err.message });
            }

            
            const filePath = path.join(uploadsDir, req.file.filename);
            res.status(200).send({
                message: "File uploaded successfully!",
                filePath: filePath
            });
        });
    });


    // Post Request
    app.post("/addscrollingtext", (req, res) => {
        const inputPath = req.body.path // Absolute path to input file
        
        console.log("Path :"+inputPath)
        const outputFileName = `${Date.now()}output.mp4`;
        const outputPath = path.join(__dirname, outputFileName);

        if (!fs.existsSync(inputPath)) {
            return res.status(404).json({ message: "File not found at the specified path" });
        }

        exec(
            `ffmpeg -i "${inputPath}" -vf "drawtext=text='This is Karan Kumar!':fontfile=${fontPath}:fontcolor=red:fontsize=90:x=(w-text_w)/2:y=(h-text_h)/2" "${outputPath}"`,
            (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Error processing video", error: err.message });
                }

                res.json({
                    message: "Video processed successfully",
                    outputPath,
                });
            }
        );
    });




    app.get('/download', (req, res) => {
        const pathOutput = req.query.download;
        if (!pathOutput) {
            return res.status(400).send({ message: "Path query parameter is required." });
        }

        const fullPath = path.resolve(pathOutput); // Resolve the full path securely
        if (!fs.existsSync(fullPath)) {
            return res.status(404).send({ message: "File not found." });
        }

        res.download(fullPath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send({ message: "Error downloading file." });
            }

            // Optionally delete the file after download
            fs.unlinkSync(fullPath);
        });
    });

    // Start the server
    app.listen(3000, () => {
        console.log("Server is running on Port:3000");
    });
