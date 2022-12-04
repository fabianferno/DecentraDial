/**
 *
 * ViewListing
 *
 */
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  CheckIcon,
  QuestionMarkCircleIcon,
  StarIcon,
} from '@heroicons/react/20/solid';
import { RadioGroup } from '@headlessui/react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { Tab } from '@headlessui/react';

import { useQuery, gql } from '@apollo/client';

const reviews = {
  average: 4,
  featured: [
    {
      id: 1,
      rating: 5,
      content: `
        <p>This icon pack is just what I need for my latest project. There's an icon for just about anything I could ever need. Love the playful look!</p>
      `,
      date: 'July 16, 2021',
      datetime: '2021-07-16',
      author: 'Emily Selman',
      avatarSrc:
        'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
    },
    {
      id: 2,
      rating: 5,
      content: `
        <p>Blown away by how polished this icon pack is. Everything looks so consistent and each SVG is optimized out of the box so I can use it directly with confidence. It would take me several hours to create a single icon this good, so it's a steal at this price.</p>
      `,
      date: 'July 12, 2021',
      datetime: '2021-07-12',
      author: 'Hector Gibbons',
      avatarSrc:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
    },
    // More reviews...
  ],
};

const product = {
  name: 'Everyday Ruck Snack',
  href: '#',
  price: '$220',
  description:
    "Don't compromise on snack-carrying capacity with this lightweight and spacious bag. The drawstring top keeps all your favorite chips, crisps, fries, biscuits, crackers, and cookies secure.",
  imageSrc:
    'https://tailwindui.com/img/ecommerce-images/product-page-04-featured-product-shot.jpg',
  imageAlt:
    'Model wearing light green backpack with black canvas straps and front zipper pouch.',
  breadcrumbs: [
    { id: 1, name: 'Travel', href: '#' },
    { id: 2, name: 'Bags', href: '#' },
  ],
  sizes: [
    { name: '18L', description: 'Perfect for a reasonable amount of snacks.' },
    { name: '20L', description: 'Enough room for a serious amount of snacks.' },
  ],
};
const ratings = { average: 4, totalCount: 1624 };

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

interface Props {}

export function ViewListing(props: Props) {
  const [selectedSize, setSelectedSize] = useState(1);
  const [isloading, setIsLoading] = React.useState(false);
  const [txns, setTxns] = React.useState<any>();
  const [error1, setError] = useState(false);

  const [NFTs, setNFTs] = React.useState<any>();
  const [dataFetched, setDataFetched] = React.useState(false);

  useEffect(() => {}, []);

  //nft by id
  const tokenId = window.location.pathname.split('/')[2];
  console.log('tokenId', tokenId);

  const { loading, error, data } = useQuery(gql`
    query {
      mints(
        where: { tokenId: 0 }
        orderBy: blockTimestamp
        orderDirection: asc
      ) {
        tokenId
        tokenURI
      }
    }
  `);

  // if (data) {
  //   console.log(data);
  // }

  const fetchMetaData = async tokenUri => {
    let response = await fetch(`https://cloudflare-ipfs.com/ipfs/${tokenUri}`);
    let data = await response.json();
    return data;
  };

  if (data && !dataFetched) {
    let mint = data.mints[0];
    // data.mints.map(async mint => {
    let tokenUri = mint.tokenURI;
    // console.log(mint.tokenId);
    fetchMetaData(tokenUri).then(res => {
      res = { tokenId: mint.tokenId, ...res };
      console.log(res);
      setNFTs(res);
      setDataFetched(true);
    });
    // console.log('metaData', metadata);
    // console.log({ tokenId: String(mint.tokenId), ...metadata });
    // setNFTs({ tokenId: String(mint.tokenId), ...metadata });
    // // });
    // setDataFetched(true);
  }

  useEffect(() => {
    const retrieveData = async () => {};
    retrieveData();
  }, []);
  //get nft by id
  // const getNFTById = async () => {
  //   const nft = data.mints.find(nft => nft.tokenId === tokenId);
  //   const metaData = await fetchMetaData(nft.tokenURI);

  //   setNFTs(metaData);

  //   setDataFetched(true);
  // };

  // if (!dataFetched && data) {
  //   getNFTById();
  // }
  // console.log('NFTs', NFTs);

  let contract_address =
    process.env.REACT_APP_CONTRACT ||
    '0xBe4053793A42eb6cDB10FDC32a8783E95238E7cC';

  const getDataFromCovalentAPI = URL => {
    let headers = new Headers();
    const authString = `${process.env.REACT_APP_COVALENT_API_KEY}:`;
    headers.set('Authorization', 'Basic ' + btoa(authString));
    return fetch(URL, { method: 'GET', headers: headers }).then(resp => {
      if (resp.status === 200) return resp.json();
      else throw new Error('Invalid response');
    });
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getDataFromCovalentAPI(
        `https://api.covalenthq.com/v1/80001/address/${contract_address}/transactions_v2/?key=ckey_78ec9b22555b4bc6bb3023a2fe3`,
      );
      console.log('data', data);
      setTxns(data.data.items);
    } catch (error) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (contract_address) {
      fetchData();
    }
  }, [contract_address]);

  return (
    <div>
      <div className="mx-auto max-w-2xl py-4 px-4 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
        {/* Product details */}
        <div className="lg:max-w-lg lg:self-end">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {product.breadcrumbs.map((breadcrumb, breadcrumbIdx) => (
                <li key={breadcrumb.id}>
                  <div className="flex items-center text-sm">
                    <a
                      href={breadcrumb.href}
                      className="font-medium text-gray-500 hover:text-gray-900"
                    >
                      {breadcrumb.name}
                    </a>
                    {breadcrumbIdx !== product.breadcrumbs.length - 1 ? (
                      <svg
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        aria-hidden="true"
                        className="ml-2 h-5 w-5 flex-shrink-0 text-gray-300"
                      >
                        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                      </svg>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {NFTs && NFTs.name}
            </h1>
          </div>

          <section aria-labelledby="information-heading" className="mt-4">
            <h2 id="information-heading" className="sr-only">
              Product information
            </h2>

            <div className="flex items-center">
              <p className="text-lg text-gray-900 sm:text-xl">
                {NFTs && NFTs.company_name}
              </p>

              <div className="ml-4 border-l border-gray-300 pl-4">
                <h2 className="sr-only">Ratings</h2>
                <div className="flex items-center">
                  <div>
                    <div className="flex items-center">
                      {[0, 1, 2, 3, 4].map(rating => (
                        <StarIcon
                          key={rating}
                          className={classNames(
                            ratings.average > rating
                              ? 'text-yellow-400'
                              : 'text-gray-300',
                            'h-5 w-5 flex-shrink-0',
                          )}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="sr-only">{ratings.average} out of 5 stars</p>
                  </div>
                  <p className="ml-2 text-sm text-gray-500">
                    {ratings.totalCount} ratings
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-6">
              <p className="text-base text-gray-500">
                {NFTs && NFTs.description}
              </p>
            </div>

            <div className="mt-4 space-y-6">
              <p className="text-base text-gray-500">
                <b>Timings -</b> {NFTs && NFTs.openTime} -{' '}
                {NFTs && NFTs.closeTime}
              </p>
            </div>

            <div className="mt-4 space-y-6">
              <p className="text-base text-gray-500">
                <b>Address -</b> {NFTs && NFTs.address}
              </p>
            </div>

            <div className="mt-6 flex items-center">
              <CheckIcon
                className="h-5 w-5 flex-shrink-0 text-green-500"
                aria-hidden="true"
              />
              <p className="ml-2 text-sm text-gray-500">
                In stock and ready to ship
              </p>
            </div>
          </section>
        </div>
        {/* Product image */}
        <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-center">
          <div className="aspect-w-1 aspect-h-1 overflow-hidden rounded-lg">
            <img
              src={
                NFTs &&
                `https://cloudflare-ipfs.com/ipfs/${
                  NFTs.image.split('ipfs://')[1]
                }`
              }
              alt={NFTs && NFTs.name}
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        {/* Product form */}
        <div className="mt-10 lg:col-start-1 lg:row-start-2 lg:max-w-lg lg:self-start">
          <section aria-labelledby="options-heading">
            <h2 id="options-heading" className="sr-only">
              Product options
            </h2>

            <form>
              {/* <div className="sm:flex sm:justify-between"> */}
              {/* Size selector */}
              {/* <RadioGroup value={selectedSize} onChange={setSelectedSize}>
                  <RadioGroup.Label className="block text-sm font-medium text-gray-700">
                    Size
                  </RadioGroup.Label>
                  <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {product.sizes.map(size => (
                      <RadioGroup.Option
                        as="div"
                        key={size.name}
                        value={size}
                        className={({ active }) =>
                          classNames(
                            active ? 'ring-2 ring-indigo-500' : '',
                            'relative block cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none',
                          )
                        }
                      >
                        {({ active, checked }) => (
                          <>
                            <RadioGroup.Label
                              as="p"
                              className="text-base font-medium text-gray-900"
                            >
                              {size.name}
                            </RadioGroup.Label>
                            <RadioGroup.Description
                              as="p"
                              className="mt-1 text-sm text-gray-500"
                            >
                              {size.description}
                            </RadioGroup.Description>
                            <div
                              className={classNames(
                                active ? 'border' : 'border-2',
                                checked
                                  ? 'border-indigo-500'
                                  : 'border-transparent',
                                'pointer-events-none absolute -inset-px rounded-lg',
                              )}
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </RadioGroup.Option>
                    ))}
                  </div>
                </RadioGroup>
              </div>  */}
              {/* <div className="mt-4">
                <a
                  href="!#"
                  className="group inline-flex text-sm text-gray-500 hover:text-gray-700"
                >
                  <span>What size should I buy?</span>
                  <QuestionMarkCircleIcon
                    className="ml-2 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                </a>
              </div> */}
              <div className="mt-10">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-8 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                >
                  Book now
                </button>
              </div>
              <div className="mt-6 text-center">
                <a
                  href="!#"
                  className="group inline-flex text-base font-medium"
                >
                  <ShieldCheckIcon
                    className="mr-2 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                  <span className="text-gray-500 hover:text-gray-700">
                    Lifetime Guarantee
                  </span>
                </a>
              </div>
            </form>
          </section>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">
              Transactions
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all the transactions for this business(NFT)
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                      >
                        Token ID
                      </th>
                      <th
                        scope="col"
                        className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6"
                      >
                        From Address
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                      >
                        To Address
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                      >
                        Transaction Hash
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {txns &&
                      txns.map(txn => (
                        <tr key={txn.hash}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            0
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {txn.from_address}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {txn.to_address}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {txn.tx_hash}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 w-full max-w-2xl lg:col-span-4 lg:mt-0 lg:max-w-none pb-8">
        <Tab.Group as="div">
          <div className="border-b border-gray-200">
            <Tab.List className="-mb-px flex space-x-8">
              <Tab
                className={({ selected }) =>
                  classNames(
                    selected
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-700 hover:text-gray-800 hover:border-gray-300',
                    'whitespace-nowrap border-b-2 py-6 text-sm font-medium',
                  )
                }
              >
                Customer Reviews
              </Tab>
            </Tab.List>
          </div>
          <Tab.Panels as={Fragment}>
            <Tab.Panel className="-mb-10">
              <h3 className="sr-only">Customer Reviews</h3>

              {reviews.featured.map((review, reviewIdx) => (
                <div
                  key={review.id}
                  className="flex space-x-4 text-sm text-gray-500"
                >
                  <div className="flex-none py-10">
                    <img
                      src={review.avatarSrc}
                      alt=""
                      className="h-10 w-10 rounded-full bg-gray-100"
                    />
                  </div>
                  <div
                    className={classNames(
                      reviewIdx === 0 ? '' : 'border-t border-gray-200',
                      'py-10',
                    )}
                  >
                    <h3 className="font-medium text-gray-900">
                      {review.author}
                    </h3>
                    <p>
                      <time dateTime={review.datetime}>{review.date}</time>
                    </p>

                    <div className="mt-4 flex items-center">
                      {[0, 1, 2, 3, 4].map(rating => (
                        <StarIcon
                          key={rating}
                          className={classNames(
                            review.rating > rating
                              ? 'text-yellow-400'
                              : 'text-gray-300',
                            'h-5 w-5 flex-shrink-0',
                          )}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="sr-only">{review.rating} out of 5 stars</p>

                    <div
                      className="prose prose-sm mt-4 max-w-none text-gray-500"
                      dangerouslySetInnerHTML={{ __html: review.content }}
                    />
                  </div>
                </div>
              ))}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
