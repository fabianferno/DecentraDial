/**
 *
 * CreateListing
 *
 */
import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { storageClient } from '../../../utils/NftStorageClient';
import { ethers, utils } from 'ethers';
import ContractABI from '../../../contracts/ABI.json';
import { v4 as uuid } from 'uuid';
import {
  createClient,
  signCreatePostTypedData,
  LENS_HUB_CONTRACT_ADDRESS,
} from '../../../api';
import { AppContext } from '../../../context';
import { refreshAuthToken, splitSignature, getSigner } from '../../../util';
import LENSHUB from '../../../abi/lenshub.json';

declare var window: any;

interface Props {}

export function CreateListing(props: Props) {
  const [listing, setListing] = React.useState({
    serviceName: '',
    companyName: '',
    description: '',
    image: '',
    address: '',
    openTime: '',
    closeTime: '',
    emailAddress: '',
    country: '',
  });

  const profile = useContext(AppContext);
  console.log('listing', profile);
  const [imageUrl, setImageUrl] = useState(
    'https://reactnativecode.com/wp-content/uploads/2018/02/Default_Image_Thumbnail.png',
  );

  const [mintLoading, setMintLoading] = useState(false);

  const hasTxBeenIndexed = async input => {
    console.log(input);
    const urqlClient = await createClient();
    const result = await urqlClient
      .query(
        `query HasTxHashBeenIndexed {
        hasTxHashBeenIndexed(request: { txHash: "${input['txHash']}" } ) {
          ... on TransactionIndexedResult {
            indexed
            txReceipt {
              to
              from
              contractAddress
              transactionIndex
              root
              gasUsed
              logsBloom
              blockHash
              transactionHash
              blockNumber
              confirmations
              cumulativeGasUsed
              effectiveGasPrice
              byzantium
              type
              status
              logs {
                blockNumber
                blockHash
                transactionIndex
                removed
                address
                data
                topics
                transactionHash
                logIndex
              }
            }
            metadataStatus {
              status
              reason
            }
          }
          ... on TransactionError {
            reason
            txReceipt {
              to
              from
              contractAddress
              transactionIndex
              root
              gasUsed
              logsBloom
              blockHash
              transactionHash
              blockNumber
              confirmations
              cumulativeGasUsed
              effectiveGasPrice
              byzantium
              type
              status
              logs {
                blockNumber
                blockHash
                transactionIndex
                removed
                address
                data
                topics
                transactionHash
                logIndex
              }
            }
          },
          __typename
        }
      }`,
      )
      .toPromise();

    console.log(result.data.hasTxHashBeenIndexed);

    return result.data.hasTxHashBeenIndexed;
  };

  const pollUntilIndexed = async txHash => {
    console.log(txHash);
    while (true) {
      const response = await hasTxBeenIndexed(txHash);
      console.log('pool until indexed: result', response);

      if (response.__typename === 'TransactionIndexedResult') {
        console.log('pool until indexed: indexed', response.indexed);
        console.log(
          'pool until metadataStatus: metadataStatus',
          response.metadataStatus,
        );

        console.log(response.metadataStatus);
        if (response.metadataStatus) {
          if (response.metadataStatus.status === 'SUCCESS') {
            return response;
          }

          if (response.metadataStatus.status === 'METADATA_VALIDATION_FAILED') {
            throw new Error(response.metadataStatus.status);
          }
        } else {
          if (response.indexed) {
            return response;
          }
        }

        console.log(
          'pool until indexed: sleep for 1500 milliseconds then try again',
        );
        // sleep for a second before trying again
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        // it got reverted and failed!
        throw new Error(response.reason);
      }
    }
  };
  async function uploadToIPFS() {
    const metaData = {
      version: '2.0.0',
      mainContentFocus: 'TEXT_ONLY',
      metadata_id: uuid(),
      description: listing.description,
      locale: 'en-US',
      content: listing.serviceName,
      external_url: `https://lenster.xyz/u/${listing.companyName}`,
      image: null,
      imageMimeType: null,
      name: `${uuid()}-${listing.companyName}`,
      attributes: [],
      tags: [],
    };

    const cid = await storageClient.storeBlob(
      new Blob([JSON.stringify(metaData)], { type: 'application/json' }),
    );
    // const added = await client.add(JSON.stringify(metaData))
    const uri = `https://cloudflare-ipfs.com/ipfs/${cid}`;
    return uri;
  }

  let publicationId = 0;

  const handleSubmit = async () => {
    setMintLoading(true);

    // const contentURI = await uploadToIPFS();
    // const { accessToken }: any = await refreshAuthToken();
    // const createPostRequest = {
    //   profileId: profile.id,
    //   contentURI,
    //   collectModule: {
    //     freeCollectModule: { followerOnly: true },
    //   },
    //   referenceModule: {
    //     followerOnlyReferenceModule: false,
    //   },
    // };
    // try {
    //   const signedResult = await signCreatePostTypedData(
    //     createPostRequest,
    //     accessToken,
    //   );
    //   const typedData = signedResult.result.typedData;
    //   const { v, r, s } = splitSignature(signedResult.signature);

    //   const contract = new ethers.Contract(
    //     LENS_HUB_CONTRACT_ADDRESS,
    //     LENSHUB,
    //     getSigner(),
    //   );

    //   const tx = await contract.postWithSig({
    //     profileId: typedData.value.profileId,
    //     contentURI: typedData.value.contentURI,
    //     collectModule: typedData.value.collectModule,
    //     collectModuleInitData: typedData.value.collectModuleInitData,
    //     referenceModule: typedData.value.referenceModule,
    //     referenceModuleInitData: typedData.value.referenceModuleInitData,
    //     sig: {
    //       v,
    //       r,
    //       s,
    //       deadline: typedData.value.deadline,
    //     },
    //   });

    //   // const data = await tx.wait();
    //   // console.log("before creation:", data);
    //   console.log('successfully created post: tx hash', tx.hash);

    //   const indexResult = await pollUntilIndexed({
    //     txHash: tx.hash,
    //   });

    //   const logs = indexResult.txReceipt.logs;

    //   const topicId = utils.id(
    //     'PostCreated(uint256,address,address,string,string,address,bytes,string,uint256)',
    //   );

    //   const profileCreatedLog = logs.find(l => l.topics[0] === topicId);

    //   let profileCreatedEventLog = profileCreatedLog.topics;

    //   publicationId = utils.defaultAbiCoder.decode(
    //     ['uint256'],
    //     profileCreatedEventLog[2],
    //   )[0];
    // } catch (err) {
    //   console.log('error: ', err);
    // }

    let metadata: any = {
      name: listing.serviceName,
      description: listing.description,
      company_name: listing.companyName,
      image: listing.image,
      address: listing.address,
      openTime: listing.openTime,
      closeTime: listing.closeTime,
      emailAddress: listing.emailAddress,
      country: listing.country,
      // publicationId: publicationId,
    };
    const ipfsData = await storageClient.store(metadata);
    let token_uri = ipfsData.url.slice(7);

    console.log('Metadata stored on IPFS', ipfsData);

    console.log('token_uri', token_uri);

    let receipt = await mintNFT(token_uri);
    console.log(receipt);

    window.location.replace('/listings');
  };

  const mintNFT = async token_uri => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    const walletAddress = accounts[0]; // first account in MetaMask

    console.log('Wallet Address', walletAddress);

    const signer = provider.getSigner(walletAddress);

    const contract = new ethers.Contract(
      process.env.REACT_APP_CONTRACT ||
        '0x72927B4cff1bCc07F71E5CFa4826ac67534c5DE6',
      ContractABI,
      signer,
    );

    const tx = await contract.safeMint(walletAddress, token_uri);

    const receipt = await tx.wait();

    console.log('Mint Complete');

    setMintLoading(false);
    return receipt;
  };

  return (
    <>
      <form className="space-y-8 divide-y divide-gray-200">
        <div>
          <div>
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Create A Business Listing
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                This information will be minted on the blockchain and will be
                displayed publicly so be careful what you share.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label
                  htmlFor="service-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Service Name
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="service-name"
                    id="service-name"
                    onChange={(e: any) => {
                      setListing({
                        ...listing,
                        serviceName: e.target.value,
                      });
                    }}
                    autoComplete="family-name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="company-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="company-name"
                    id="company-name"
                    onChange={(e: any) => {
                      setListing({
                        ...listing,
                        companyName: e.target.value,
                      });
                    }}
                    autoComplete="family-name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    onChange={(e: any) => {
                      setListing({
                        ...listing,
                        description: e.target.value,
                      });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    defaultValue={''}
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="image-url"
                  className="block text-sm font-medium text-gray-700"
                >
                  Service Image
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <button>
                    <input
                      type="file"
                      className="ml-0 mt-1 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      name="image-url"
                      id="image-url"
                      onChange={(e: any) => {
                        let file = e.target.files[0];
                        let file_url = URL.createObjectURL(file);
                        setImageUrl(file_url);

                        setListing({
                          ...listing,
                          image: file,
                        });
                      }}
                      autoComplete="family-name"
                    />
                  </button>
                </div>
                <div className="mt-5">
                  <img
                    style={{ height: '200px' }}
                    src={imageUrl}
                    alt=""
                    srcSet=""
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <div className="mt-1">
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    onChange={(e: any) => {
                      setListing({
                        ...listing,
                        address: e.target.value,
                      });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    defaultValue={''}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label
                  htmlFor="open-time"
                  className="block text-sm font-medium text-gray-700"
                >
                  Open Time
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="open-time"
                    id="open-time"
                    onChange={(e: any) => {
                      setListing({
                        ...listing,
                        openTime: e.target.value,
                      });
                    }}
                    autoComplete="given-name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="close-time"
                  className="block text-sm font-medium text-gray-700"
                >
                  Close Time
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="close-time"
                    id="close-time"
                    onChange={(e: any) => {
                      setListing({
                        ...listing,
                        closeTime: e.target.value,
                      });
                    }}
                    autoComplete="family-name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    onChange={(e: any) => {
                      setListing({
                        ...listing,
                        emailAddress: e.target.value,
                      });
                    }}
                    autoComplete="email"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700"
                >
                  Country
                </label>
                <div className="mt-1">
                  <input
                    id="country"
                    name="country"
                    onChange={(e: any) => {
                      setListing({
                        ...listing,
                        country: e.target.value,
                      });
                    }}
                    type="text"
                    // autoComplete="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              onClick={e => {
                e.preventDefault();
                console.log('Minting Started');
                handleSubmit();
              }}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create
            </button>
            {mintLoading && (
              <button className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-300 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Loading, wait for the transaction to complete.
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
