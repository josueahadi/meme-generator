import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <main className="flex items-center justify-center py-10 px-6">
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
                  <Input placeholder="Add text" {...field} />
                </FormControl>
                {/* <FormDescription>
                    This is the text that will be displayed at the top of the
                    image.
                  </FormDescription> */}
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
                  <Input placeholder="Add text" {...field} />
                </FormControl>
                {/* <FormDescription>
                    This is the text that will be displayed at the bottom of the
                    image.
                  </FormDescription> */}
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
    </main>
  );
};

export default Meme;
