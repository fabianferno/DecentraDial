/**
 *
 * SignIn
 *
 */
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useSmartAccountContext } from '../../../contexts/SmartAccountContext';
import { useWeb3AuthContext } from '../../../contexts/SocialLoginContext';
import { ethers, utils } from 'ethers';
import {
  createClient,
  STORAGE_KEY,
  authenticate as authenticateMutation,
  getChallenge,
  getDefaultProfile,
  createProfile,
} from '../../../api';
import { parseJwt, refreshAuthToken } from '../../../util';
import { AppContext } from '../../../context';

declare var window: any;

interface Props {}

export function SignIn(props: Props) {
  const [providerFound, setProviderFound] = useState(false);

  const {
    address,
    loading: eoaLoading,
    userInfo,
    connect,
    disconnect,
    getUserInfo,
  } = useWeb3AuthContext();
  const {
    selectedAccount,
    loading: scwLoading,
    setSelectedAccount,
  } = useSmartAccountContext();
  console.log('address', address);

  const [userAddress, setUserAddress]: any = useState();
  const [userProfile, setUserProfile] = useState();

  const hasTxBeenIndexed = async input => {
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

    return result.data.hasTxHashBeenIndexed;
  };

  const pollUntilIndexed = async txHash => {
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

  async function getUserProfile(address) {
    try {
      const urqlClient = await createClient();
      const response = await urqlClient
        .query(getDefaultProfile, {
          address,
        })
        .toPromise();
      console.log(response.data.defaultProfile);
      setUserProfile(response.data.defaultProfile);
    } catch (err) {
      const urqlClient = await createClient();
      const response = await urqlClient
        .mutation(createProfile, {
          request: {
            handle: 'hello',
            profilePictureUri: null,
            followNFTURI: null,
            followModule: null,
          },
        })
        .toPromise();

      if (response.data.createProfile.__typename === 'RelayError') {
        console.log(response.data.createProfile);
        console.error('create profile: failed');
        return;
      }

      const indexResult = await pollUntilIndexed({
        txHash: response.data.createProfile.txHash,
      });

      const logs = indexResult.txReceipt.logs;

      const topicId = utils.id(
        'ProfileCreated(uint256,address,address,string,string,address,bytes,string,uint256)',
      );

      const profileCreatedLog = logs.find(l => l.topics[0] === topicId);

      let profileCreatedEventLog = profileCreatedLog.topics;

      const profileId = utils.defaultAbiCoder.decode(
        ['uint256'],
        profileCreatedEventLog[1],
      )[0];
    }
  }

  useEffect(() => {
    (async () => {
      const accounts = await window.ethereum.send('eth_requestAccounts');
      const account = accounts.result[0];
      console.log('wallet:', account);

      setUserAddress(address);
      const urqlClient = await createClient();
      const response = await urqlClient
        .query(getChallenge, {
          address: account,
        })
        .toPromise();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const signature = await signer.signMessage(response.data.challenge.text);
      const authData = await urqlClient
        .mutation(authenticateMutation, {
          address: account,
          signature,
        })
        .toPromise();
      const { accessToken, refreshToken } = authData.data.authenticate;
      const accessTokenData = parseJwt(accessToken);
      console.log(accessTokenData);

      console.log('provider', provider);
      console.log('signer', await signer.getAddress());

      // try {
      //   getUserProfile(address);
      // } catch (error) {
      //   console.log(error);
      // }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accessToken,
          refreshToken,
          exp: accessTokenData.exp,
        }),
      );

      if (provider) {
        setProviderFound(true);
      } else {
        setProviderFound(false);
      }

      let signerAddress = await signer.getAddress();

      // Redirect to /view-listing if provider is found
      if (signerAddress) {
        window.location.replace('/listings');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      console.log('provider', provider);
      console.log('signer', await signer.getAddress());

      let signerAddress = await signer.getAddress();

      // Redirect to /view-listing if provider is found
      if (signerAddress) {
        window.location.replace('/listings');
      }
    })();
  }, []);

  return (
    <>
      <div className="flex min-h-screen">
        <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <img
                className="h-20 w-auto "
                style={{ marginLeft: '-15px' }}
                src="https://media.discordapp.net/attachments/1047762094562492457/1048518872489267210/DecentralDial_text_BLACK.png?width=1427&height=361"
                alt="Your Company"
              />
              <button className="mt-6 text-3xl font-bold tracking-tight text-gray-900"></button>
              <p className="mt-2 text-lg font-bold text-gray-600">
                The decentralized business directory for a modern web{' '}
              </p>
            </div>

            <div className="mt-8">
              <div className="mt-6">
                <div>
                  {address ? (
                    <div>
                      {!providerFound && (
                        <div
                          onClick={() => {
                            console.log('connect');
                            connect();
                          }}
                          className="flex w-full justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Link your metamask wallet
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedAccount(null);
                          disconnect();
                        }}
                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        await connect();
                      }}
                      className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Sign in
                    </button>
                  )}
                </div>
                {/* </form> */}
              </div>
            </div>
          </div>
        </div>
        <div className="relative hidden w-0 flex-1 lg:block">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={require('./landing.jpg')}
            alt=""
          />
        </div>
      </div>
    </>
  );
}
