'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const FavoritesContext = createContext({});

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [validFavorites, setValidFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // localStorage에서 관심상품 목록 불러오기 및 유효성 검사
  useEffect(() => {
    const loadAndCleanupFavorites = async () => {
      try {
        const savedFavorites = localStorage.getItem('carrot_market_favorites');
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites);
          // ID들을 문자열로 정규화
          const normalizedFavorites = parsed.map(id => String(id));
          setFavorites(normalizedFavorites);
          
          // 존재하지 않는 상품 ID 정리
          await cleanupInvalidFavorites(normalizedFavorites);
        } else {
          setValidFavorites([]);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        setValidFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadAndCleanupFavorites();
  }, []);

  // 존재하지 않는 상품 ID 정리
  const cleanupInvalidFavorites = useCallback(async (favoriteIds) => {
    if (!favoriteIds || favoriteIds.length === 0) {
      setValidFavorites([]);
      return [];
    }

    try {
      // 관심상품 ID들 중 실제 존재하는 상품만 조회
      const { data: existingProducts, error } = await supabase
        .from('market')
        .select('id')
        .in('id', favoriteIds);

      if (error) {
        console.error('Error checking existing products:', error);
        setValidFavorites(favoriteIds); // 오류 시 원본 유지
        return favoriteIds;
      }

      // 실제 존재하는 상품 ID만 추출
      const existingIds = (existingProducts || []).map(product => String(product.id));
      
      // 존재하지 않는 상품이 있는 경우에만 localStorage 업데이트
      if (existingIds.length !== favoriteIds.length) {
        localStorage.setItem('carrot_market_favorites', JSON.stringify(existingIds));
        setFavorites(existingIds);
      }
      
      setValidFavorites(existingIds);
      return existingIds;

    } catch (error) {
      console.error('Error during cleanup:', error);
      setValidFavorites(favoriteIds); // 오류 시 원본 유지
      return favoriteIds;
    }
  }, []); // 의존성이 없으므로 빈 배열

  // localStorage에 관심상품 목록 저장
  const saveFavorites = (newFavorites) => {
    try {
      localStorage.setItem('carrot_market_favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      
      // 새로 저장할 때도 유효성 검사
      cleanupInvalidFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // 관심상품 추가
  const addToFavorites = (productId) => {
    const normalizedProductId = String(productId);
    
    if (!favorites.includes(normalizedProductId)) {
      const newFavorites = [...favorites, normalizedProductId];
      saveFavorites(newFavorites);
      return true;
    }
    return false;
  };

  // 관심상품 제거
  const removeFromFavorites = (productId) => {
    const normalizedProductId = String(productId);
    
    const newFavorites = favorites.filter(id => id !== normalizedProductId);
    saveFavorites(newFavorites);
    return true;
  };

  // 관심상품 토글
  const toggleFavorite = (productId) => {
    const normalizedProductId = String(productId);
    
    if (favorites.includes(normalizedProductId)) {
      removeFromFavorites(normalizedProductId);
      return false; // 제거됨
    } else {
      addToFavorites(normalizedProductId);
      return true; // 추가됨
    }
  };

  // 특정 상품이 관심상품인지 확인 (유효한 상품만)
  const isFavorite = (productId) => {
    const normalizedProductId = String(productId);
    return validFavorites.includes(normalizedProductId);
  };

  // 관심상품 개수 (유효한 상품만)
  const favoritesCount = validFavorites.length;

  // 수동으로 정리 함수 제공
  const refreshFavorites = useCallback(async () => {
    await cleanupInvalidFavorites(favorites);
  }, [favorites, cleanupInvalidFavorites]);

  const value = {
    favorites,
    validFavorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    favoritesCount,
    refreshFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}; 