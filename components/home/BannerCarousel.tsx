'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Zap, Crown, Gift, Star, Video } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';

interface BannerSlide {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  buttonAction: () => void;
  icon: React.ElementType;
  gradient: string;
  imageUrl?: string;
}

interface BannerCarouselProps {
  onCreateRoom?: () => void;
  onExploreRooms?: () => void;
  onViewNotifications?: () => void;
  onRandomConnect?: () => void;
}

export function BannerCarousel({ 
  onCreateRoom, 
  onExploreRooms,
  onViewNotifications,
  onRandomConnect
}: BannerCarouselProps) {
  const [api, setApi] = React.useState<any>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const slides: BannerSlide[] = [
    {
      id: '1',
      title: 'Random Connect',
      description: 'Meet random people online! Video chat, voice call, and text with strangers from around the world.',
      buttonText: 'Start Random Chat',
      buttonAction: onRandomConnect || (() => {}),
      icon: Video,
      gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    },
    {
      id: '2',
      title: 'Create Your Own Room',
      description: 'Start conversations, build communities, and connect with people who share your interests.',
      buttonText: 'Create Room',
      buttonAction: onCreateRoom || (() => {}),
      icon: Users,
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
    },
    {
      id: '3',
      title: 'Connect Instantly',
      description: 'Send messages, share moments, and stay connected with your friends in real-time.',
      buttonText: 'Start Chatting',
      buttonAction: onExploreRooms || (() => {}),
      icon: MessageCircle,
      gradient: 'from-green-500 via-teal-500 to-blue-500',
    },
    {
      id: '4',
      title: 'Discover New Features',
      description: 'Voice broadcasting, push notifications, and more exciting features to explore.',
      buttonText: 'Explore',
      buttonAction: onExploreRooms || (() => {}),
      icon: Zap,
      gradient: 'from-orange-500 via-red-500 to-pink-500',
    },
    {
      id: '5',
      title: 'Premium Coming Soon',
      description: 'Unlock exclusive features, custom themes, and priority support with Premium.',
      buttonText: 'Learn More',
      buttonAction: () => {},
      icon: Crown,
      gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="w-full">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="p-1">
                <Card className="border-0 overflow-hidden py-0">
                  <CardContent className="p-0">
                    <div
                      className={`relative bg-gradient-to-r ${slide.gradient} px-6 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 text-white overflow-hidden rounded-lg`}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}></div>
                      </div>

                      {/* Content */}
                      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5">
                            <slide.icon className="h-10 w-10 sm:h-12 sm:w-12" />
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                            {slide.title}
                          </h3>
                          <p className="text-white/90 text-sm sm:text-base mb-4">
                            {slide.description}
                          </p>
                          <Button
                            onClick={slide.buttonAction}
                            className="bg-white text-gray-900 hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all"
                            size="lg"
                          >
                            {slide.buttonText}
                          </Button>
                        </div>

                        {/* Decorative Element */}
                        <div className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                          <Star className="h-32 w-32" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-12" />
        <CarouselNext className="hidden sm:flex -right-12" />
      </Carousel>

      {/* Carousel Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === current 
                ? 'w-8 bg-primary' 
                : 'w-8 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

