"use client";

import React, {useState, useEffect, ChangeEvent, MouseEventHandler} from 'react';
import { FaStar } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { GoHeartFill } from "react-icons/go";
import { GoHeart } from "react-icons/go";


import InputComponent from "~/app/_components/common/Input";
import Loading from "~/app/_components/common/Loading";

import { api } from "~/trpc/react";
import {categoryKRLanguage, cityKRLanguage} from "~/app/constants";
import {Restaurant} from "~/models";

const RestaurantsComponent = ({ masterData, handleFavorite, isLoading, restIdSelected }: { masterData: Restaurant[], handleFavorite: (id: string, isFavorite: boolean) => MouseEventHandler, isLoading: boolean, restIdSelected: string }) => {
    return (
        <>
            {
                masterData?.length > 0
                    ? <div className="flex flex-col items-center overflow-y-scroll overflow-auto scrollbar-hide">
                        {masterData?.length && masterData.map((restaurant) => (
                            <div key={restaurant.id} className="flex flex-col bg-white shadow mb-4 rounded-[16px] max-w-[395px] w-full">
                                <div className="relative">
                                    <div className="w-[36px] h-[36px] bg-white rounded-[50%] absolute opacity-50 right-2 top-2 z-1 cursor-pointer" onClick={handleFavorite(restaurant.id, restaurant.isFavorite)}/>
                                    {
                                        isLoading && restIdSelected === restaurant.id
                                            ? <Loading width={20} height={20} customClass='absolute right-4 top-4' />
                                            : (
                                                <>
                                                    {
                                                        restaurant?.isFavorite
                                                            ? <GoHeartFill size={20} color="#FDB022" className="absolute right-4 top-4 cursor-pointer" onClick={handleFavorite(restaurant.id, restaurant.isFavorite)}/>
                                                            : <GoHeart size={20} color="white" className="absolute right-4 top-4 cursor-pointer" onClick={handleFavorite(restaurant.id, restaurant.isFavorite)}/>
                                                    }
                                                </>
                                            )
                                    }
                                    <img src={`/images/${restaurant.imageId[0]}.jpg`} alt={restaurant.name} className="w-full h-[200px] object-cover rounded-t-[16px]" />
                                </div>
                                <div className="p-4">
                                    {restaurant?.isFavorite ?
                                        <div className="flex">
                                            <BsStars color="#FF692E" size="12"/>
                                            <p className="mb-1 text-[#FF692E] text-sm">{restaurant.featured}</p>
                                        </div> : <div className="h-[24px]"/>
                                    }
                                    <div className="flex justify-between">
                                        <p className="text-[#344054] text-base font-bold truncate">{restaurant.name}</p>
                                        <div className="flex">
                                            <FaStar size="14" color="#FDB022"/>
                                            <p className="ml-1 text-[#344054] text-sm">{`${restaurant.rating}(2)`}</p>
                                        </div>
                                    </div>
                                    <p className="text-[#344054] text-sm truncate">{restaurant.desc}</p>
                                    <p className="text-[#344054] text-sm">{`${cityKRLanguage[`${restaurant.city}`]} · ${categoryKRLanguage[`${restaurant.category.name}`]} · ${restaurant.price_range}만원`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    : <div className="h-[calc(100vh_-_120px)] max-w-[395px] flex flex-col justify-center">
                        <h2 className="text-[#667085] text-center">No Data Found</h2>
                        <p className="text-[#667085] text-center">Sorry, we couldn't find any data to display.</p>
                    </div>
            }
        </>

    );
};

const SearchRestaurant = () => {
    const [categories] = api.category.getCategories.useSuspenseQuery();
    const [restaurants] = api.restaurant.getRestaurants.useSuspenseQuery();
    const utils = api.useUtils();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [inputValue, setInputValue] = useState<string>('');
    const [restId, setRestId] = useState<string>('');
    const [categorySelected, setCategorySelected] = useState<string>('');

    const [restaurantsByCategoryId] = api.restaurant.getByCategoryId.useSuspenseQuery({ id: categorySelected });
    const mutationUpdateFavorite = api.restaurant.updateFavorite.useMutation();

    const [listRestaurants, setListRestaurants] = useState<Restaurant[]>([]);

    useEffect(() => {
        if (categorySelected) {
            setListRestaurants(restaurantsByCategoryId?.length ? [...restaurantsByCategoryId].filter(res => res.name.startsWith(inputValue)) : []);
            setIsLoading(false);
            return;
        }
        setListRestaurants(restaurants?.length ? [...restaurants].filter(res => res.name.startsWith(inputValue)) : []);
        setIsLoading(false);
    }, [categorySelected, restaurants, restaurantsByCategoryId, inputValue])

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleOnSelectCategory = (id: string) => () => {
        setIsLoading(true);
        setInputValue('');
        if (id === categorySelected) {
            return setCategorySelected('')
        }
        return setCategorySelected(id);
    }

    const handleFavorite = (id: string, isFavorite: boolean) => async () => {
        setRestId(id)
        await mutationUpdateFavorite.mutateAsync({
            id,
            isFavorite: !isFavorite,
        },{
            onSuccess: () => {
                setRestId('');
                if (categorySelected) {
                    return utils.restaurant.getByCategoryId.invalidate();
                }
                utils.restaurant.getRestaurants.invalidate();
            }
        });
    }

    return (
        <>
            <div className="pt-4 px-4 container flex flex-col h-[calc(100vh_-_120px)] w-[395px] bg-white shadow rounded-t-[4px]">
                <InputComponent
                    placeholder="맛집 이름을 검색해보세요"
                    value={inputValue}
                    onChange={handleInputChange}/>
                <div className="flex overflow-x-scroll overflow-auto scrollbar-hide my-2 h-auto min-h-[40px] items-center">
                    {categories?.length && categories.map((ct, idx) => (
                      <p
                          key={idx}
                          className={`truncate w-auto min-w-[100px] text-[#667085] cursor-pointer hover:bg-[#F9FAFB] hover:text-black ${categorySelected === ct.id ? 'bg-[#F9FAFB] text-black' : ''}`}
                          onClick={handleOnSelectCategory(ct.id)}>
                          {categoryKRLanguage[`${ct.name}`]}
                      </p>
                    ))}
                </div>
                {
                    isLoading
                    ? <Loading />
                    : <RestaurantsComponent
                         masterData={listRestaurants}
                         handleFavorite={(id, isFavorite) => handleFavorite(id, isFavorite)}
                         isLoading={mutationUpdateFavorite.isPending}
                         restIdSelected={restId}
                      />
                }
            </div>
        </>
    )
}
export default SearchRestaurant;
