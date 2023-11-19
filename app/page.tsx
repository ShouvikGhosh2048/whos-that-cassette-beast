import * as cheerio from 'cheerio';
import CassetteBeastGuesser from './cassetteBeastGuesser';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Who's that Cassette Beast?",
  description: "A website for guessing Cassette Beasts.",
};

export default async function Home() {
  const speciesPage = await fetch('https://wiki.cassettebeasts.com/api.php?action=parse&page=Species&format=json');
  const speciesPageJSON = await speciesPage.json();
  const speciesPageHTML = speciesPageJSON.parse.text["*"];
  const $ = cheerio.load(speciesPageHTML);
  const $td = $('td');

  const images: string[] = [];
  const names: string[] = [];
  $td.each((i, el) => {
    // Each row has 10 elements.
    // We skip the first row (Magikrab).
    // The first td in a row contains the image.
    // The second td in a row contains the name.

    if (i % 10 === 0 && i > 9) {
      const image = $(el).find('img').prop('src');
      if (image !== undefined) {
        // Convert
        // /images/thumb/3/3c/Springheel.png/30px-Springheel.png
        // to
        // /images/3/3c/Springheel.png
        // for higher resolution image.

        const parts = image.split('/');
        const partsWithoutThumbnail = parts.filter(part => part !== 'thumb');
        const removeLastPart = partsWithoutThumbnail.slice(0, partsWithoutThumbnail.length - 1);
        const imageURL = removeLastPart.join('/');
        images.push(imageURL);
      }
    }
    if (i % 10 == 1 && i > 9) {
      names.push($(el).text());
    }
  });

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center space-y-3">
      <p className="text-2xl p-2 text-center">
        Who&apos;s that Cassette Beast?
      </p>
      <CassetteBeastGuesser names={names} images={images}/>
      <div className="flex justify-center">
        <a href="https://github.com/ShouvikGhosh2048/whos-that-cassette-beast" className="underline">Github</a>
      </div>
    </div>
  );
}
