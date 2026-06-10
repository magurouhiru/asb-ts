import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/ocr")({
  component: OcrComponent,
});

interface Region {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RegionImage {
  name: string;
  imageSrc: string;
}

function OcrComponent() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasReff = useRef<HTMLCanvasElement | null>(null);
  const [regionImage, setRegionImage] = useState<RegionImage[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setImageSrc(URL.createObjectURL(files[0]));
    }
  };

  useEffect(() => {
    if (imageSrc && canvasReff.current) {
      const canvas = canvasReff.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          getRegions(img.width, img.height).forEach(
            ({ x, y, width, height }) => {
              ctx.strokeStyle = "red";
              ctx.lineWidth = 5;
              ctx.strokeRect(x, y, width, height);
            },
          );
        };
        img.src = imageSrc;
      }
    }
  }, [imageSrc]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <canvas ref={canvasReff} className="w-full"></canvas>
    </div>
  );
}

const getRegions = (width: number, height: number): Region[] => {
  const regions: Region[] = [];

  const nameY = height * 0.17;
  const dw = height * 0.2;
  const dh = height * 0.024;
  regions.push({
    name: "name",
    x: (width - dw) / 2,
    y: nameY,
    width: dw,
    height: dh,
  });
  regions.push({
    name: "level",
    x: (width - dw) / 2,
    y: nameY + dh,
    width: dw,
    height: dh,
  });
  return regions;
};
