import * as React from 'react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { utils } from 'ethers';

import { NotFoundPage } from './components/NotFoundPage/Loadable';
import { useTranslation } from 'react-i18next';
import { SignIn } from './pages/SignIn';
import { Listings } from './pages/Listings';
import { Layout } from './pages/Layout';
import { CreateListing } from './pages/CreateListing';
import { ViewListing } from './pages/ViewListing';
import Landing from './pages/Landing';
import { AppContext } from '../context';
import { useWeb3AuthContext } from '../contexts/SocialLoginContext';
import {
  createClient,
  STORAGE_KEY,
  authenticate as authenticateMutation,
  getChallenge,
  getDefaultProfile,
  createProfile,
} from '../api';
// import Analytics from './pages/Analytics';

export function App() {
  const { i18n } = useTranslation();

  const {
    address,
    loading: eoaLoading,
    userInfo,
    connect,
    disconnect,
    getUserInfo,
  } = useWeb3AuthContext();

  console.log('address', address);

  const [userProfile, setUserProfile] = useState();

  useEffect(() => {
    (async () => {
      try {
        const urqlClient = await createClient();
        const response = await urqlClient
          .query(getDefaultProfile, {
            address,
          })
          .toPromise();
        setUserProfile(response?.data?.defaultProfile);
      } catch (err) {
        console.log(err);
      }
    })();
  }, [address]);

  return (
    <AppContext.Provider
      value={{
        userAddress: address,
        profile: userProfile,
      }}
    >
      <BrowserRouter>
        <Helmet
          titleTemplate="%s - Decentradial"
          defaultTitle="Decentradial"
          htmlAttributes={{ lang: i18n.language }}
        >
          <meta name="description" content="Decentradial" />
        </Helmet>

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<Layout />}>
            <Route path="/listings" element={<Listings />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/view-listing/:id" element={<ViewListing />} />
            {/* <Route path="/analytics" element={< Analytics />} /> */}
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
