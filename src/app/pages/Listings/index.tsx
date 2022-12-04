/**
 *
 * Listings
 *
 */
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckIcon,
  QuestionMarkCircleIcon,
  StarIcon,
} from '@heroicons/react/20/solid';
import { useQuery, gql } from '@apollo/client';

let array = [2, 4];

const products = [
  {
    id: 1,
    name: 'Basic Tee 8-Pack',
    href: '#',
    price: '$256',
    description:
      'Get the full lineup of our Basic Tees. Have a fresh shirt all week, and an extra for laundry day.',
    options: '8 colors',
    imageSrc:
      'https://tailwindui.com/img/ecommerce-images/category-page-02-image-card-01.jpg',
    imageAlt:
      'Eight shirts arranged on table in black, olive, grey, blue, white, red, mustard, and green.',
  },
  {
    id: 2,
    name: 'Basic Tee',
    href: '#',
    price: '$32',
    description:
      'Look like a visionary CEO and wear the same black t-shirt every day.',
    options: 'Black',
    imageSrc:
      'https://tailwindui.com/img/ecommerce-images/category-page-02-image-card-02.jpg',
    imageAlt: 'Front of plain black t-shirt.',
  },
  {
    id: 3,
    name: 'Basic Tee',
    href: '#',
    price: '$32',
    description:
      'Look like a visionary CEO and wear the same black t-shirt every day.',
    options: 'Black',
    imageSrc:
      'https://tailwindui.com/img/ecommerce-images/category-page-02-image-card-02.jpg',
    imageAlt: 'Front of plain black t-shirt.',
  },
];

interface Props {}

export function Listings(props: Props) {
  const [isloading, setIsLoading] = React.useState(false);
  const [NFTs, setNFTs] = React.useState<any>([]);
  const [dataFetched, setDataFetched] = React.useState(false);

  const { loading, error, data } = useQuery(gql`
    query {
      mints {
        tokenId
        tokenURI
      }
    }
  `);

  useEffect(() => {
    (async () => {
      if (data) {
        let temp: any = [];
        for (let i = 0; i < data.mints.length; i++) {
          let mint = data.mints[i];
          console.log(mint);
          let metadata = await fetchMetaData(mint.tokenURI);
          temp.push({ tokenId: String(mint.tokenId), ...metadata });
        }
        setNFTs(temp);
        setIsLoading(true);
        setDataFetched(true);
      }
    })();
  }, []);

  const fetchMetaData = async tokenUri => {
    let response = await fetch(`https://cloudflare-ipfs.com/ipfs/${tokenUri}`)
      .then(response => {
        return response.json();
      })
      .catch(err => {
        console.log(err);
      });

    return response;
  };

  return (
    <div className="shadow-2xl">
      <div className="mx-auto max-w-lg">
        <div>
          <form action="#" className="mt-6 flex shadow-xl">
            <label htmlFor="email" className="sr-only">
              Search
            </label>
            <input
              type="keywords"
              name="keywords"
              id="keywords"
              className="block w-full px-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search for businesses"
            />
            <button
              type="submit"
              className="ml-4 flex-shrink-0 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Search
            </button>
          </form>
        </div>
      </div>
      <div>
        <div className="mx-auto max-w-2xl pt-8 pb-4 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8">
            {!isloading && (
              <div
                className="text-center flex justify-center items-center w-1"
                style={{ textAlign: 'center' }}
              >
                <img
                  src="https://miro.medium.com/max/1400/1*CsJ05WEGfunYMLGfsT2sXA.gif"
                  alt=""
                  srcSet=""
                />
              </div>
            )}

            {NFTs.length > 0 &&
              NFTs.map((nft: any, index: number) => (
                <Link to={`/view-listing/${nft.tokenId}`} key={index}>
                  <div className="group shadow relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="aspect-w-3 aspect-h-4 bg-gray-200 group-hover:opacity-75 sm:aspect-none sm:h-96">
                      <img
                        src={`https://cloudflare-ipfs.com/ipfs/${
                          nft.image.split('ipfs://')[1]
                        }`}
                        alt="nft logo"
                        className="h-full w-full object-cover object-center sm:h-full sm:w-full"
                      />
                    </div>
                    <div className="flex flex-1 flex-col space-y-2 p-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        <span aria-hidden="true" className="absolute inset-0" />
                        {nft.name} by {nft.company_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {nft.emailAddress}
                      </p>
                      <p className="text-sm text-gray-500">{nft.description}</p>
                      <div className="flex flex-1 flex-col justify-end">
                        <p className="text-sm italic text-gray-500">
                          {nft.address}
                        </p>
                        <p className="text-base font-medium text-gray-900">
                          {nft.openTime} - {nft.closeTime}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div>
                          <div className="flex items-center">
                            <StarIcon
                              className={'text-yellow-400'}
                              aria-hidden="true"
                            />
                            <StarIcon
                              className={'text-yellow-400'}
                              aria-hidden="true"
                            />
                            <StarIcon
                              className={'text-yellow-400'}
                              aria-hidden="true"
                            />
                            <StarIcon
                              className={'text-yellow-400'}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                        <p className="ml-2 text-sm text-gray-500">5 reviews</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
