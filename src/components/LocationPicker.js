'use client';
import { useState } from 'react';

// 수도권 주요 지역 목록 (서울 + 경기도)
const METRO_AREAS = {
  // 서울특별시
  '서울 강남구': ['역삼동', '논현동', '압구정동', '청담동', '삼성동', '대치동', '개포동'],
  '서울 서초구': ['서초동', '반포동', '잠원동', '방배동', '양재동'],
  '서울 송파구': ['잠실동', '석촌동', '삼전동', '가락동', '문정동', '장지동'],
  '서울 강동구': ['강일동', '상일동', '명일동', '고덕동', '암사동', '천호동'],
  '서울 마포구': ['홍대입구', '합정동', '망원동', '연남동', '성산동', '상암동'],
  '서울 용산구': ['이태원동', '한남동', '용산동', '청파동', '원효로동'],
  '서울 종로구': ['종로1가', '종로2가', '종로3가', '인사동', '삼청동', '혜화동'],
  '서울 중구': ['명동', '충무로', '을지로', '신당동', '동대문'],
  '서울 성동구': ['성수동', '왕십리', '금호동', '옥수동', '행당동'],
  '서울 광진구': ['건대입구', '구의동', '자양동', '중곡동'],
  '서울 동대문구': ['회기동', '휘경동', '이문동', '장안동'],
  '서울 성북구': ['성북동', '삼선동', '동선동', '돈암동', '안암동'],
  '서울 도봉구': ['쌍문동', '방학동', '창동', '도봉동'],
  '서울 노원구': ['노원동', '상계동', '중계동', '하계동', '공릉동'],
  '서울 은평구': ['은평구청', '연신내', '불광동', '응암동', '역촌동'],
  '서울 서대문구': ['신촌', '홍제동', '북아현동', '충정로'],
  '서울 강서구': ['김포공항', '마곡동', '염창동', '등촌동', '화곡동'],
  '서울 양천구': ['목동', '신정동', '신월동'],
  '서울 영등포구': ['영등포구청', '당산동', '문래동', '양평동', '대림동'],
  '서울 구로구': ['구로디지털단지', '신도림', '구로동', '오류동'],
  '서울 금천구': ['가산디지털단지', '독산동', '시흥동'],
  '서울 관악구': ['신림동', '봉천동', '서원동', '사당동'],
  '서울 동작구': ['노량진', '상도동', '사당동', '대방동'],
  '서울 강북구': ['수유동', '미아동', '번동'],
  '서울 중랑구': ['면목동', '상봉동', '중화동', '묵동'],

  // 경기도 주요 시
  '수원시': ['영통구', '장안구', '팔달구', '영통동', '인계동', '매탄동', '원천동', '광교동', '화서동'],
  '성남시': ['분당구', '수정구', '중원구', '정자동', '서현동', '야탑동', '이매동', '금곡동', '상대원동'],
  '용인시': ['기흥구', '수지구', '처인구', '죽전동', '수지동', '기흥동', '동백동', '보정동', '용인대역'],
  '고양시': ['일산동구', '일산서구', '덕양구', '일산동', '일산서', '화정동', '행신동', '대화동', '주엽동'],
  '부천시': ['원미구', '소사구', '오정구', '부천역', '상동', '중동', '송내동', '괴안동'],
  '안양시': ['만안구', '동안구', '안양역', '평촌동', '범계동', '인덕원', '관양동'],
  '안산시': ['단원구', '상록구', '고잔동', '선부동', '원곡동', '본오동', '사동'],
  '평택시': ['평택역', '송탄동', '팽성읍', '안중읍', '현덕면', '오성면'],
  '시흥시': ['정왕동', '은행동', '대야동', '신천동', '매화동'],
  '광명시': ['소하동', '철산동', '하안동', '광명역', '일직동'],
  '군포시': ['산본동', '당정동', '부곡동', '금정동'],
  '의왕시': ['내손동', '고천동', '청계동', '오전동'],
  '과천시': ['갈현동', '별양동', '중앙동', '과천동'],
  '구리시': ['갈매동', '인창동', '교문동', '수택동'],
  '남양주시': ['다산동', '별내동', '화도읍', '와부읍', '오남읍', '진접읍'],
  '하남시': ['신장동', '덕풍동', '창우동', '감북동', '풍산동'],
  '김포시': ['사우동', '장기동', '구래동', '감정동', '걸포동'],
  '광주시': ['경안동', '송정동', '오포읍', '곤지암읍'],
  '이천시': ['증포동', '창전동', '중리동', '부발읍'],
  '여주시': ['여주읍', '가남읍', '점동면'],
  '오산시': ['오산동', '세교동', '죽미동', '원동'],
  '양주시': ['회천동', '광적면', '장흥면'],
  '포천시': ['포천동', '소흘읍', '가산면'],
  '파주시': ['금촌동', '운정동', '교하읍', '문산읍'],
  '연천군': ['연천읍', '전곡읍', '청산면'],
  '가평군': ['가평읍', '청평면', '설악면'],
  '양평군': ['양평읍', '용문면', '강하면']
};

export default function LocationPicker({ 
  currentLocation, 
  onLocationChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 지역 검색 필터링
  const getFilteredLocations = () => {
    if (!searchTerm) return METRO_AREAS;
    
    const filtered = {};
    Object.entries(METRO_AREAS).forEach(([area, neighborhoods]) => {
      const filteredNeighborhoods = neighborhoods.filter(neighborhood =>
        neighborhood.includes(searchTerm) || area.includes(searchTerm)
      );
      if (filteredNeighborhoods.length > 0 || area.includes(searchTerm)) {
        filtered[area] = filteredNeighborhoods.length > 0 ? filteredNeighborhoods : neighborhoods;
      }
    });
    return filtered;
  };

  const handleLocationSelect = (location) => {
    onLocationChange(location);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedArea('');
  };

  // 지역별 그룹화 (서울/경기도 구분)
  const groupedLocations = () => {
    const filtered = getFilteredLocations();
    const seoul = {};
    const gyeonggi = {};

    Object.entries(filtered).forEach(([area, neighborhoods]) => {
      if (area.startsWith('서울')) {
        seoul[area] = neighborhoods;
      } else {
        gyeonggi[area] = neighborhoods;
      }
    });

    return { seoul, gyeonggi };
  };

  const { seoul, gyeonggi } = groupedLocations();
  const filteredLocations = getFilteredLocations();

  return (
    <div className="relative">
      {/* 현재 선택된 위치 표시 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 border border-gray-300 rounded-lg bg-white hover:border-orange-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <span className="font-medium text-gray-900">
            {currentLocation || '지역을 선택하세요'}
          </span>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* 지역 선택 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="지역 이름으로 검색... (예: 강남, 분당, 일산)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
            />
          </div>

          {/* 지역 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {/* 서울특별시 */}
            {Object.keys(seoul).length > 0 && (
              <>
                <div className="px-4 py-2 bg-orange-100 border-b font-bold text-orange-800">
                  🏢 서울특별시
                </div>
                {Object.entries(seoul).map(([area, neighborhoods]) => (
                  <div key={area}>
                    {/* 구 이름 */}
                    <button
                      type="button"
                      className="w-full px-4 py-2 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 text-left"
                      onClick={() => setSelectedArea(selectedArea === area ? '' : area)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">
                          {area.replace('서울 ', '')}
                        </span>
                        <span className={`transform transition-transform text-sm ${
                          selectedArea === area ? 'rotate-180' : ''
                        }`}>
                          ▼
                        </span>
                      </div>
                    </button>

                    {/* 동네 목록 */}
                    {(selectedArea === area || searchTerm) && (
                      <div className="bg-white">
                        {neighborhoods.map((neighborhood) => (
                          <button
                            type="button"
                            key={neighborhood}
                            onClick={() => handleLocationSelect(neighborhood)}
                            className="w-full text-left px-6 py-2 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          >
                            {neighborhood}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* 경기도 */}
            {Object.keys(gyeonggi).length > 0 && (
              <>
                <div className="px-4 py-2 bg-green-100 border-b font-bold text-green-800">
                  🏔️ 경기도
                </div>
                {Object.entries(gyeonggi).map(([area, neighborhoods]) => (
                  <div key={area}>
                    {/* 시 이름 */}
                    <button
                      type="button"
                      className="w-full px-4 py-2 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 text-left"
                      onClick={() => setSelectedArea(selectedArea === area ? '' : area)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">{area}</span>
                        <span className={`transform transition-transform text-sm ${
                          selectedArea === area ? 'rotate-180' : ''
                        }`}>
                          ▼
                        </span>
                      </div>
                    </button>

                    {/* 동네 목록 */}
                    {(selectedArea === area || searchTerm) && (
                      <div className="bg-white">
                        {neighborhoods.map((neighborhood) => (
                          <button
                            type="button"
                            key={neighborhood}
                            onClick={() => handleLocationSelect(neighborhood)}
                            className="w-full text-left px-6 py-2 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          >
                            {neighborhood}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {Object.keys(filteredLocations).length === 0 && (
              <div className="p-4 text-center text-gray-500">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 