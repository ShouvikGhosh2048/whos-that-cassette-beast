'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

interface CassetteBeastImageProps {
    url: string,
    hidden: boolean,
}

function CassetteBeastImage({ url, hidden }: CassetteBeastImageProps) {
    const canvasRef = useRef<null | HTMLCanvasElement>(null);

    useEffect(() => {
        const img = new Image();
        img.addEventListener('load', () => {
            if (!canvasRef.current) {
                return;
            }

            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) {
                return;
            }

            // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
            const dpr = window.devicePixelRatio;
            const rect = canvasRef.current.getBoundingClientRect();
            canvasRef.current.width = rect.width * dpr;
            canvasRef.current.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvasRef.current.style.width = `${rect.width}px`;
            canvasRef.current.style.height = `${rect.height}px`;

            ctx.imageSmoothingEnabled = false;

            const sourceWidth = img.naturalWidth;
            const sourceHeight = img.naturalHeight;
            let resWidth = 0;
            let resHeight = 0;
            if (sourceWidth > sourceHeight) {
                resWidth = 200;
                resHeight = Math.floor(resWidth * sourceHeight / sourceWidth);
            } else {
                resHeight = 200;
                resWidth = Math.floor(resHeight * sourceWidth / sourceHeight);
            }

            ctx.clearRect(0, 0, 300, 300);
            ctx.drawImage(
                img,
                0, 0, img.naturalWidth, img.naturalHeight,
                150 - Math.floor(resWidth / 2), 150 - Math.floor(resHeight / 2), resWidth, resHeight
            );

            if (hidden) {
                const imageData = ctx.getImageData(0, 0, 300 * dpr, 300 * dpr);
                const data = imageData.data;
                for (let i = 0; i < data.length; i+=4) {
                    data[i] = 0;
                    data[i+1] = 0;
                    data[i+2] = 0;
                }
                ctx.putImageData(imageData, 0, 0);
            }
        }, false);
        img.src = url;
    }, [url, hidden]);

    return <canvas ref={canvasRef} width="300" height="300"></canvas>;
}

interface CassetteBeastGuesserProps {
    names: string[],
    images: string[],
}

export default function CassetteBeastGuesser({ names, images }: CassetteBeastGuesserProps) {
    const [currentImage, setCurrentImage] = useState<{ name: string, imageURL: string } | null>(null);
    const [nextImage, setNextImage] = useState<{ name: string, imageURL: string } | null>(null);
    const [guess, setGuess] = useState('');
    const [showAnswer, setShowAnswer] = useState(false);
    const [error, setError] = useState(false);

    // Fetch initial images.
    useEffect(() => {
        let cancel = false;

        const currentImageIndex = Math.floor(Math.random() * names.length);
        fetch('/fetchImage?url=' + images[currentImageIndex]).then(async (res) => {
            if (!res.ok) {
                setError(true);
                return;
            }

            const blob = await res.blob();
            if (cancel) {
                return;
            }
            const url = URL.createObjectURL(blob);
            setCurrentImage({ name: names[currentImageIndex], imageURL: url });
        });

        // TODO: Maybe check if it's equal to currentImageIndex and if so choose again.
        const nextImageIndex = Math.floor(Math.random() * names.length);
        fetch('/fetchImage?url=' + images[nextImageIndex]).then(async (res) => {
            if (!res.ok) {
                return;
            }

            const blob = await res.blob();
            if (cancel) {
                return;
            }
            const url = URL.createObjectURL(blob);
            setNextImage({ name: names[nextImageIndex], imageURL: url });
        });

        return () => {
            cancel = true;
        };
    }, [images, names]);

    function onGuess(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setShowAnswer(true);
    }

    function onNext() {
        setShowAnswer(false);
        setGuess('');
        setCurrentImage(nextImage);
        setNextImage(null);

        if (nextImage === null) {
            const imageIndex = Math.floor(Math.random() * names.length);
            fetch('/fetchImage?url=' + images[imageIndex]).then(async (res) => {
                if (!res.ok) {
                    setError(true);
                    return;
                }

                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setCurrentImage({ name: names[imageIndex], imageURL: url });
            });
        }

        const imageIndex = Math.floor(Math.random() * names.length);
        fetch('/fetchImage?url=' + images[imageIndex]).then(async (res) => {
            if (!res.ok) {
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setNextImage({ name: names[imageIndex], imageURL: url });
        });
    }

    if (error) {
        return <p className="h-96">An error occured while fetching the images. Try again later.</p>
    }

    if (currentImage === null) {
        return <div className="h-96"></div>;
    }

    return (
        <div className="h-96">
            {currentImage && <CassetteBeastImage url={currentImage.imageURL} hidden={!showAnswer} />}
            {!showAnswer && (
                <form onSubmit={onGuess} className="flex justify-between">
                    <input value={guess} placeholder={'Enter your guess'}
                            onChange={(e) => { setGuess(e.target.value); }}
                            className="border p-1"
                            required />
                    <input type="submit" value="Guess" className="p-1 bg-slate-900 text-white rounded"/>
                </form>
            )}
            {showAnswer && currentImage && (
                <div>
                    <p>Actual: {currentImage.name}</p>
                    <p>Guess: {guess}</p>
                    <div className="flex justify-center">
                        <button onClick={onNext} className="p-1 bg-slate-900 text-white rounded">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}