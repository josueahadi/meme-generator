import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import memesData from "@/memesData";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import "./Meme.css";

const Meme: React.FC = () => {
  const form = useForm({
    defaultValues: {
      topText: "",
      bottomText: "",
    },
  });

  const [memeImageUrl, setMemeImageUrl] = useState<string>("");
  const [topText, setTopText] = useState<string>("");
  const [bottomText, setBottomText] = useState<string>("");

  const onSubmit = (data: any) => {
    setTopText(data.topText);
    setBottomText(data.bottomText);
  };

  const memes: {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
    box_count: number;
  }[] = memesData.data.memes;

  const getRandomMemeImage = () => {
    const randomIndex: number = Math.floor(Math.random() * memes.length);
    const randomMemeImageUrl: string = memes[randomIndex].url;
    setMemeImageUrl(randomMemeImageUrl);
  };

  return (
    <main className="flex flex-col items-center justify-center py-10 px-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className=" w-full sm:w-auto grid grid-cols-2 grid-rows-2 gap-8"
        >
          <FormField
            control={form.control}
            name="topText"
            render={({ field }) => (
              <FormItem className="w-full sm:w-56">
                <FormLabel className="font-medium text-sm">Top text</FormLabel>
                <FormControl>
                  <Input placeholder="Shut up" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bottomText"
            render={({ field }) => (
              <FormItem className="w-full sm:w-56">
                <FormLabel className="font-medium text-sm">
                  Bottom text
                </FormLabel>
                <FormControl>
                  <Input placeholder="And take my money" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            onClick={getRandomMemeImage}
            className="col-span-2 bg-[#672280] hover:bg-[#A626D3] font-semibold text-white text-base"
          >
            Get a new meme image
          </Button>
        </form>
      </Form>
      <div className="w-full sm:w-[30rem] relative flex justify-center">
        {memeImageUrl && (
          <>
            <img src={memeImageUrl} alt="Random Meme" className="" />
            <h1 className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white uppercase shadow-black text-3xl font-regular z-50 text-center impact-font text-stroke">
              {topText}
            </h1>
            <h1 className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white uppercase shadow-black text-3xl font-regular z-50 text-center impact-font text-stroke">
              {bottomText}
            </h1>
          </>
        )}
      </div>
    </main>
  );
};

export default Meme;
