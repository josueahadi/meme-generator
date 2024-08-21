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

const Meme: React.FC = () => {
  const form = useForm({
    defaultValues: {
      topText: "",
      bottomText: "",
    },
  });

  const [memeImageUrl, setMemeImageUrl] = useState<string>("");

  const onSubmit = (data: any) => {
    console.log(data);
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
            className="col-span-2 bg-[#672280] hover:bg-[#A626D3] font-semibold text-white text-base"
          >
            Get a new meme image
          </Button>
        </form>
      </Form>
      <div>Random meme image</div>
    </main>
  );
};

export default Meme;
