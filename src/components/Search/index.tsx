import React, { ReactElement, useState, useEffect, useCallback } from "react";
import AssetList from "../@shared/AssetList";
import queryString from "query-string";
import Filters from "./Filters";
import Sort from "./sort";
import { getResults, updateQueryStringParameter } from "./utils";
// import { useUserPreferences } from '@context/UserPreferences'
import { useCancelToken } from "../../@hooks/useCancelToken";
import styles from "./index.module.css";
import { useRouter } from "next/router";
// not sure why this import is required
import { AssetExtended } from "../../../src/@types/AssetExtended";
import {
  getAccessDetailsForAssets,
  getAssetPrices,
} from "../../@utils/accessDetailsAndPricing";
import { useIsMounted } from "@hooks/useIsMounted";
import { OperationResult } from "urql";
import { TokensPriceQuery } from "src/@types/subgraph/TokensPriceQuery";

interface useSearchParams {
  setTotalResults: (totalResults: number) => void;
  setTotalPagesNumber: (totalPagesNumber: number) => void;
}

export function useSearch({
  setTotalResults,
  setTotalPagesNumber,
}: useSearchParams) {
  const router = useRouter();
  const [parsed, setParsed] = useState<queryString.ParsedQuery<string>>();
  const [queryResult, setQueryResult] = useState<PagedAssets>();
  const [loading, setLoading] = useState<boolean>();
  const [serviceType, setServiceType] = useState<string>();
  const [accessType, setAccessType] = useState<string>();
  const [sortType, setSortType] = useState<string>();
  const [sortDirection, setSortDirection] = useState<string>();
  const [assetsWithPrices, setAssetsWithPrices] = useState<AssetExtended[]>();
  const [assetPrices, setAssetPrices] =
    useState<
      OperationResult<
        TokensPriceQuery,
        { datatokenIds: [string]; account: string }
      >
    >();

  // const { chainIds } = useUserPreferences()
  const newCancelToken = useCancelToken();
  const isMounted = useIsMounted();

  const chainIds = [4];

  // TODO: fix this
  // useEffect(() => {
  //   const assets = queryResult?.results ?? [];
  //   if (!assets) return;
  //   if (assetsWithPrices) return;
  //   setAssetsWithPrices(assets as AssetExtended[]);
  //   setLoading(false);
  //   console.log({ assets });
  //   async function fetchPrices() {
  //     const assetsWithPrices = await getAccessDetailsForAssets(
  //       assets,
  //       // accountId || ""
  //       ""
  //     );
  //     console.log({ assetsWithPrices });
  //     if (!isMounted()) return;
  //     setAssetsWithPrices([...assetsWithPrices]);
  //   }
  //   fetchPrices();
  // }, [
  //   assetsWithPrices,
  //   queryResult,
  //   isMounted,
  //   // accountId
  // ]);

  // get the pricing info for each asset
  useEffect(() => {
    if (!queryResult?.results) return;
    (async () => {
      let res = await getAssetPrices(queryResult.results);
      console.log({ res });
      setAssetPrices(res);
    })();
  }, [queryResult]);

  useEffect(() => {
    console.log({ assetPrices });
  }, [assetPrices]);

  useEffect(() => {
    const parsed = queryString.parse(location.search);
    // TODO: switch from query searching to local state searching
    const { sort, sortOrder, serviceType, accessType } = parsed;
    setParsed(parsed);
    setServiceType(serviceType as string);
    setAccessType(accessType as string);
    setSortDirection(sortOrder as string);
    setSortType(sort as string);
  }, [router]);

  const updatePage = useCallback(
    (page: number) => {
      const { pathname, query } = router;
      const newUrl = updateQueryStringParameter(
        pathname +
          "?" +
          JSON.stringify(query)
            .replace(/"|{|}/g, "")
            .replace(/:/g, "=")
            .replace(/,/g, "&"),
        "page",
        `${page}`
      );
      return router.push(newUrl);
    },
    [router]
  );

  const fetchAssets = useCallback(
    async (parsed: queryString.ParsedQuery<string>, chainIds: number[]) => {
      setLoading(true);
      setTotalResults(undefined);
      console.log({ parsed });
      const queryResult = await getResults(parsed, chainIds, newCancelToken());
      setQueryResult(queryResult);
      setAssetsWithPrices(null);
      setAssetPrices(null);

      setTotalResults(queryResult?.totalResults || 0);
      setTotalPagesNumber(queryResult?.totalPages || 0);
      setLoading(false);
    },
    [newCancelToken, setTotalPagesNumber, setTotalResults]
  );
  useEffect(() => {
    if (!parsed || !queryResult) return;
    const { page } = parsed;
    if (queryResult.totalPages < Number(page)) updatePage(1);
  }, [parsed, queryResult, updatePage]);

  useEffect(() => {
    const chainIds = [4];
    if (!parsed || !chainIds) return;
    console.log({ chainIds });
    fetchAssets(parsed, chainIds);
  }, [parsed, newCancelToken, fetchAssets]);
  return {
    data: queryResult?.results,
    loading: loading,
    assetPrices: assetPrices,
    page: queryResult?.page,
    onPageChange: updatePage,
    totalPages: queryResult?.totalPages,
  };
}

export default function SearchPage({
  setTotalResults,
  setTotalPagesNumber,
}: {
  setTotalResults: (totalResults: number) => void;
  setTotalPagesNumber: (totalPagesNumber: number) => void;
}): ReactElement {
  const router = useRouter();
  const [parsed, setParsed] = useState<queryString.ParsedQuery<string>>();
  // const { chainIds } = useUserPreferences()
  const chainIds = [4];
  const [queryResult, setQueryResult] = useState<PagedAssets>();
  const [loading, setLoading] = useState<boolean>();
  const [serviceType, setServiceType] = useState<string>();
  const [accessType, setAccessType] = useState<string>();
  const [sortType, setSortType] = useState<string>();
  const [sortDirection, setSortDirection] = useState<string>();
  const newCancelToken = useCancelToken();

  console.log({ chainIds, queryResult });

  useEffect(() => {
    const parsed = queryString.parse(location.search);
    // TODO: switch from query searching to local state searching
    const { sort, sortOrder, serviceType, accessType } = parsed;
    setParsed(parsed);
    setServiceType(serviceType as string);
    setAccessType(accessType as string);
    setSortDirection(sortOrder as string);
    setSortType(sort as string);
  }, [router]);

  const updatePage = useCallback(
    (page: number) => {
      const { pathname, query } = router;
      const newUrl = updateQueryStringParameter(
        pathname +
          "?" +
          JSON.stringify(query)
            .replace(/"|{|}/g, "")
            .replace(/:/g, "=")
            .replace(/,/g, "&"),
        "page",
        `${page}`
      );
      return router.push(newUrl);
    },
    [router]
  );

  const fetchAssets = useCallback(
    async (parsed: queryString.ParsedQuery<string>, chainIds: number[]) => {
      setLoading(true);
      setTotalResults(undefined);
      const queryResult = await getResults(parsed, chainIds, newCancelToken());
      setQueryResult(queryResult);

      setTotalResults(queryResult?.totalResults || 0);
      setTotalPagesNumber(queryResult?.totalPages || 0);
      setLoading(false);
    },
    [newCancelToken, setTotalPagesNumber, setTotalResults]
  );
  useEffect(() => {
    if (!parsed || !queryResult) return;
    const { page } = parsed;
    if (queryResult.totalPages < Number(page)) updatePage(1);
  }, [parsed, queryResult, updatePage]);

  useEffect(() => {
    if (!parsed || !chainIds) return;
    fetchAssets(parsed, chainIds);
  }, [parsed, chainIds, newCancelToken, fetchAssets]);

  return (
    <>
      {/* <div className={styles.search}>
        <div className={styles.row}>
          <Filters
            serviceType={serviceType}
            accessType={accessType}
            setServiceType={setServiceType}
            setAccessType={setAccessType}
            addFiltersToUrl
          />
          <Sort
            sortType={sortType}
            sortDirection={sortDirection}
            setSortType={setSortType}
            setSortDirection={setSortDirection}
          />
        </div>
      </div> */}
      <div className={styles.results}>
        <AssetList
          assets={queryResult?.results}
          showPagination
          isLoading={loading}
          page={queryResult?.page}
          totalPages={queryResult?.totalPages}
          onPageChange={updatePage}
        />
      </div>
    </>
  );
}
